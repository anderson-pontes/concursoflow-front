import React from "react";
import { createPortal } from "react-dom";
import { CalendarClock, Sparkles, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DisciplinaOption } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
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

type DisciplinaRow = {
  disciplina_id: string;
  nome: string;
  peso: number;
  nivel_conhecimento: number;
};

export type GerarCronogramaAutoModalProps = {
  open: boolean;
  onClose: () => void;
  disciplinas: DisciplinaOption[];
  onSaved?: () => void;
};

type BlocoGerado = {
  disciplina_id: string;
  disciplina_nome: string;
  dia_semana: number;
  horas: number;
  data: string;
};

type GerarResponse = {
  blocos: BlocoGerado[];
  total_blocos: number;
  horas_totais: number;
  salvo: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addWeeksIso(iso: string, weeks: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function ScaleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-[120px] flex-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="rounded-md bg-[var(--bg-surface-hover)] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[var(--text-primary)]">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#6C3FC5]"
        aria-label={label}
      />
      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

export function GerarCronogramaAutoModal({
  open,
  onClose,
  disciplinas,
  onSaved,
}: GerarCronogramaAutoModalProps) {
  const [horasPorDia, setHorasPorDia] = React.useState(2);
  const [diasSemana, setDiasSemana] = React.useState<number[]>([0, 1, 2, 3, 4]);
  const [dataInicio, setDataInicio] = React.useState(todayIso);
  const [dataFim, setDataFim] = React.useState(() => addWeeksIso(todayIso(), 4));
  const [rows, setRows] = React.useState<DisciplinaRow[]>([]);
  const [preview, setPreview] = React.useState<GerarResponse | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setHorasPorDia(2);
    setDiasSemana([0, 1, 2, 3, 4]);
    setDataInicio(todayIso());
    setDataFim(addWeeksIso(todayIso(), 4));
    setPreview(null);
    setRows(
      disciplinas.map((d) => ({
        disciplina_id: d.id,
        nome: d.nome,
        peso: 3,
        nivel_conhecimento: 3,
      })),
    );
  }, [open, disciplinas]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggleDia = (v: number) => {
    setDiasSemana((cur) => {
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return [...next].sort((a, b) => a - b);
    });
    setPreview(null);
  };

  const updateRow = (id: string, patch: Partial<Pick<DisciplinaRow, "peso" | "nivel_conhecimento">>) => {
    setRows((cur) => cur.map((r) => (r.disciplina_id === id ? { ...r, ...patch } : r)));
    setPreview(null);
  };

  const validate = (): string | null => {
    if (diasSemana.length === 0) return "Selecione pelo menos um dia da semana.";
    if (horasPorDia <= 0) return "Informe horas por dia maior que zero.";
    if (dataFim < dataInicio) return "A data de fim deve ser posterior à data de início.";
    if (rows.length === 0) return "Cadastre ao menos uma disciplina para gerar o cronograma.";
    for (const r of rows) {
      if (r.peso < 1 || r.peso > 5 || r.nivel_conhecimento < 1 || r.nivel_conhecimento > 5) {
        return "Preencha peso e nível (1–5) para todas as disciplinas.";
      }
    }
    return null;
  };

  const buildPayload = (salvar: boolean) => ({
    horas_por_dia: horasPorDia,
    dias_semana: diasSemana,
    data_inicio: dataInicio,
    data_fim: dataFim,
    disciplinas: rows.map((r) => ({
      disciplina_id: r.disciplina_id,
      peso: r.peso,
      nivel_conhecimento: r.nivel_conhecimento,
    })),
    salvar,
  });

  const gerarMutation = useMutation({
    mutationFn: async (salvar: boolean) =>
      (await api.post("/cronograma/gerar-automatico", buildPayload(salvar))).data as GerarResponse,
    onSuccess: (data, salvar) => {
      setPreview(data);
      if (salvar) {
        toast.success(`Cronograma salvo — ${data.total_blocos} blocos, ${data.horas_totais.toFixed(1)}h no período.`);
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
    const map = new Map<string, { nome: string; horas: number }[]>();
    for (const b of preview.blocos) {
      const key = String(b.dia_semana);
      const list = map.get(key) ?? [];
      const existing = list.find((x) => x.nome === b.disciplina_nome);
      if (existing) existing.horas += b.horas;
      else list.push({ nome: b.disciplina_nome, horas: b.horas });
      map.set(key, list);
    }
    return map;
  }, [preview]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10020] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !gerarMutation.isPending) onClose();
      }}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[20px] border border-border bg-card shadow-2xl sm:rounded-2xl"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
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
              <h2 className="text-lg font-bold text-card-foreground">Gerar cronograma automático</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                O algoritmo distribui horas por disciplina conforme peso e nível de conhecimento.
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold text-card-foreground">Disponibilidade</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Horas por dia</label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={horasPorDia}
                  onChange={(e) => {
                    setHorasPorDia(Number(e.target.value));
                    setPreview(null);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-muted-foreground">Mín. 0,5h — máx. 12h</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-card-foreground">Dias disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => {
                    const on = diasSemana.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDia(d.value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                          on
                            ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
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
            <h3 className="text-sm font-semibold text-card-foreground">Disciplinas</h3>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma disciplina disponível. Cadastre disciplinas vinculadas ao concurso ativo.
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((r) => (
                  <li
                    key={r.disciplina_id}
                    className="rounded-xl border border-border bg-card p-3 shadow-sm"
                  >
                    <p className="mb-3 truncate text-sm font-semibold text-card-foreground">{r.nome}</p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ScaleField
                        label="Peso"
                        hint="1 = baixa · 5 = alta prioridade"
                        value={r.peso}
                        onChange={(v) => updateRow(r.disciplina_id, { peso: v })}
                      />
                      <ScaleField
                        label="Nível"
                        hint="1 = nunca vi · 5 = domínio total"
                        value={r.nivel_conhecimento}
                        onChange={(v) => updateRow(r.disciplina_id, { nivel_conhecimento: v })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {preview && previewSemanal ? (
            <section className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/20">
              <h3 className="text-sm font-semibold text-card-foreground">Prévia do padrão semanal</h3>
              <p className="text-xs text-muted-foreground">
                {preview.total_blocos} blocos no período · {preview.horas_totais.toFixed(1)}h totais
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DIAS_SEMANA.filter((d) => previewSemanal.has(String(d.value))).map((d) => (
                  <div key={d.value} className="rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs">
                    <p className="mb-1 font-semibold text-card-foreground">{d.full}</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {(previewSemanal.get(String(d.value)) ?? []).map((item) => (
                        <li key={item.nome} className="flex justify-between gap-2">
                          <span className="truncate">{item.nome}</span>
                          <span className="shrink-0 tabular-nums">{item.horas.toFixed(1)}h</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {preview.blocos.length > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Primeiro bloco: {preview.blocos[0].disciplina_nome} em{" "}
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
              disabled={gerarMutation.isPending || rows.length === 0}
              className="rounded-lg border border-primary-300 bg-background px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-950/30"
            >
              {gerarMutation.isPending ? "Gerando…" : "Visualizar prévia"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={gerarMutation.isPending || rows.length === 0}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Gerar e salvar
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
