import React from "react";
import { CalendarClock, Sparkles, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DisciplinaOption } from "@/lib/cronograma/types";
import { fmtPontos } from "@/lib/disciplinas/pontos";
import { fmtBlocoMinutos } from "@/lib/cronograma/constants";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/services/api";

const DIAS_SEMANA = [
  { value: 0, label: "Seg", full: "Segunda" },
  { value: 1, label: "Ter", full: "Terça" },
  { value: 2, label: "Qua", full: "Quarta" },
  { value: 3, label: "Qui", full: "Quinta" },
  { value: 4, label: "Sex", full: "Sexta" },
  { value: 5, label: "Sáb", full: "Sábado" },
  { value: 6, label: "Dom", full: "Domingo" },
] as const;

const DURACOES_PRESET = [25, 50, 90] as const;

type DisciplinaRow = {
  disciplina_id: string;
  nome: string;
  pesoEdital: number;
  incluida: boolean;
};

type BlocoGerado = {
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string;
  topico_nome: string;
  dia_semana: number;
  duracao_minutos: number;
  data: string;
  modo: string;
};

type GerarResponse = {
  blocos: BlocoGerado[];
  total_blocos: number;
  minutos_totais: number;
  salvo: boolean;
};

export type GerarCronogramaAutoModalProps = {
  open: boolean;
  onClose: () => void;
  disciplinas: DisciplinaOption[];
  onSaved?: () => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addWeeksIso(iso: string, weeks: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function GerarCronogramaAutoModal({
  open,
  onClose,
  disciplinas,
  onSaved,
}: GerarCronogramaAutoModalProps) {
  const [sessoesPorDia, setSessoesPorDia] = React.useState<Record<number, number>>({
    0: 2,
    1: 2,
    2: 2,
    3: 2,
    4: 2,
    5: 0,
    6: 0,
  });
  const [duracaoSessao, setDuracaoSessao] = React.useState(50);
  const [duracaoCustom, setDuracaoCustom] = React.useState("");
  const [dataInicio, setDataInicio] = React.useState(todayIso);
  const [dataFim, setDataFim] = React.useState(() => addWeeksIso(todayIso(), 4));
  const [rows, setRows] = React.useState<DisciplinaRow[]>([]);
  const [preview, setPreview] = React.useState<GerarResponse | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setSessoesPorDia({ 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 0, 6: 0 });
    setDuracaoSessao(50);
    setDuracaoCustom("");
    setDataInicio(todayIso());
    setDataFim(addWeeksIso(todayIso(), 4));
    setPreview(null);
    setRows(
      disciplinas.map((d) => ({
        disciplina_id: d.id,
        nome: d.nome,
        pesoEdital: d.total_pontos ?? d.peso ?? 1,
        incluida: true,
      })),
    );
  }, [open, disciplinas]);

  const duracaoResolvida = React.useMemo(() => {
    if (duracaoCustom.trim()) {
      const n = parseInt(duracaoCustom, 10);
      if (Number.isFinite(n) && n >= 5 && n <= 240) return n;
    }
    return duracaoSessao;
  }, [duracaoCustom, duracaoSessao]);

  const includedRows = React.useMemo(() => rows.filter((r) => r.incluida), [rows]);

  const toggleIncluida = (id: string) => {
    setRows((cur) => cur.map((r) => (r.disciplina_id === id ? { ...r, incluida: !r.incluida } : r)));
    setPreview(null);
  };

  const setSessoesDia = (dia: number, n: number) => {
    setSessoesPorDia((cur) => ({ ...cur, [dia]: Math.max(0, Math.min(12, n)) }));
    setPreview(null);
  };

  const validate = (): string | null => {
    const diasAtivos = Object.entries(sessoesPorDia).filter(([, n]) => n > 0);
    if (diasAtivos.length === 0) return "Informe ao menos um dia com sessões.";
    if (duracaoResolvida < 5) return "Duração da sessão deve ser de pelo menos 5 minutos.";
    if (dataFim < dataInicio) return "A data de fim deve ser posterior à data de início.";
    if (includedRows.length === 0) return "Inclua ao menos uma disciplina no cronograma.";
    return null;
  };

  const buildPayload = (salvar: boolean) => ({
    sessoes_por_dia: Object.fromEntries(
      Object.entries(sessoesPorDia)
        .map(([k, v]) => [Number(k), v])
        .filter(([, v]) => v > 0),
    ),
    duracao_sessao_min: duracaoResolvida,
    data_inicio: dataInicio,
    data_fim: dataFim,
    disciplina_ids: includedRows.map((r) => r.disciplina_id),
    salvar,
  });

  const gerarMutation = useMutation({
    mutationFn: async (salvar: boolean) =>
      (await api.post("/cronograma/gerar-automatico", buildPayload(salvar))).data as GerarResponse,
    onSuccess: (data, salvar) => {
      setPreview(data);
      if (salvar) {
        toast.success(
          `Cronograma salvo — ${data.total_blocos} sessões, ${fmtBlocoMinutos(data.minutos_totais)} no período.`,
        );
        onSaved?.();
        onClose();
      } else {
        toast.success("Prévia gerada. Revise e clique em salvar quando estiver pronto.");
      }
    },
    onError: () => toast.error("Não foi possível gerar o cronograma. Verifique os dados."),
  });

  const handlePreview = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    gerarMutation.mutate(false);
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (
      !window.confirm(
        "Isso substituirá os blocos atuais do cronograma semanal pelo padrão gerado. Deseja continuar?",
      )
    ) {
      return;
    }
    gerarMutation.mutate(true);
  };

  const previewSemanal = React.useMemo(() => {
    if (!preview?.blocos.length) return null;
    const map = new Map<number, BlocoGerado[]>();
    for (const b of preview.blocos) {
      const list = map.get(b.dia_semana) ?? [];
      list.push(b);
      map.set(b.dia_semana, list);
    }
    return map;
  }, [preview]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !gerarMutation.isPending) onClose();
      }}
    >
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="flex max-h-[94vh] w-full max-w-[640px] flex-col gap-0 overflow-hidden rounded-t-[20px] border border-border bg-card p-0 font-sans shadow-2xl sm:rounded-2xl"
      >
        <header className="relative shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12">
          <button
            type="button"
            onClick={onClose}
            disabled={gerarMutation.isPending}
            className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-card-foreground">Gerar cronograma automático</DialogTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Distribui sessões por assunto conforme peso e domínio cadastrados nos tópicos.
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold text-card-foreground">Disponibilidade</h3>
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Sessões por dia</p>
              <div className="grid grid-cols-7 gap-1.5">
                {DIAS_SEMANA.map((d) => (
                  <div key={d.value} className="text-center">
                    <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">{d.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={sessoesPorDia[d.value] ?? 0}
                      onChange={(e) => setSessoesDia(d.value, parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-lg border border-border bg-background px-1 py-1.5 text-center text-xs tabular-nums outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Duração da sessão</p>
              <div className="flex flex-wrap gap-2">
                {DURACOES_PRESET.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDuracaoSessao(m);
                      setDuracaoCustom("");
                      setPreview(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                      duracaoSessao === m && !duracaoCustom
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {m} min
                  </button>
                ))}
                <input
                  type="number"
                  min={5}
                  max={240}
                  placeholder="Custom"
                  value={duracaoCustom}
                  onChange={(e) => {
                    setDuracaoCustom(e.target.value);
                    setPreview(null);
                  }}
                  className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs tabular-nums outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Capacidade semanal:{" "}
                {Object.values(sessoesPorDia).reduce((s, n) => s + n, 0) * duracaoResolvida} min
              </p>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <CalendarClock className="h-4 w-4" />
              Período
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Data de início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setPreview(null);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Data de fim</label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setPreview(null);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-card-foreground">Disciplinas</h3>
              <span className="text-xs text-muted-foreground">
                Peso e domínio vêm dos tópicos cadastrados
              </span>
            </div>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma disciplina no catálogo. Cadastre em <strong>Disciplinas &amp; Tópicos</strong>.
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li
                    key={r.disciplina_id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-opacity",
                      r.incluida ? "border-border" : "border-dashed border-border/70 opacity-55",
                    )}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-border text-primary-600"
                        checked={r.incluida}
                        onChange={() => toggleIncluida(r.disciplina_id)}
                      />
                      <span className="min-w-0 truncate text-sm font-semibold text-card-foreground">{r.nome}</span>
                    </label>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {fmtPontos(r.pesoEdital)} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {preview && previewSemanal ? (
            <section className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/20">
              <h3 className="text-sm font-semibold text-card-foreground">Prévia do padrão semanal</h3>
              <p className="text-xs text-muted-foreground">
                {preview.total_blocos} sessões no período · {fmtBlocoMinutos(preview.minutos_totais)} totais
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DIAS_SEMANA.filter((d) => previewSemanal.has(d.value)).map((d) => (
                  <div key={d.value} className="rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs">
                    <p className="mb-1 font-semibold text-card-foreground">{d.full}</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {(previewSemanal.get(d.value) ?? []).map((b, i) => (
                        <li key={`${b.topico_id}-${i}`} className="flex flex-col gap-0.5">
                          <span className="truncate font-medium text-card-foreground">{b.disciplina_nome}</span>
                          <span className="truncate text-[10px]">{b.topico_nome}</span>
                          <span className="flex items-center gap-1.5 text-[10px]">
                            <span className="tabular-nums">{fmtBlocoMinutos(b.duracao_minutos)}</span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 font-semibold",
                                b.modo === "revisao"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
                              )}
                            >
                              {b.modo === "revisao" ? "revisão" : "aprendizado"}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {preview.blocos.length > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Primeira sessão: {preview.blocos[0].topico_nome} ({preview.blocos[0].disciplina_nome}) em{" "}
                  {format(parseISO(preview.blocos[0].data), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-card px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={gerarMutation.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={gerarMutation.isPending || includedRows.length === 0}
              className="rounded-lg border border-primary-300 bg-background px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-950/30"
            >
              {gerarMutation.isPending ? "Gerando…" : "Visualizar prévia"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={gerarMutation.isPending || includedRows.length === 0}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Gerar e salvar
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
