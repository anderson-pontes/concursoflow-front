import React from "react";
import { createPortal } from "react-dom";
import { CalendarClock, Sparkles, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DisciplinaOption } from "@/lib/cronograma/types";
import { getDisciplinaTotalPontos, fmtPontos, fmtPeso } from "@/lib/disciplinas/pontos";
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
  pesoEdital: number;
  nivel_conhecimento: number;
  incluida: boolean;
  /** minutos; vazio = usa o mínimo global */
  minSessaoMin: string;
};

/** Duração mínima por sessão: minutos, múltiplos de 5, de 0 (padrão) a 60. */
const MIN_SESSAO_MAX = 60;
const MIN_SESSAO_STEP = 5;

function snapMinSessao(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const snapped = Math.round(v / MIN_SESSAO_STEP) * MIN_SESSAO_STEP;
  return Math.min(MIN_SESSAO_MAX, Math.max(0, snapped));
}

/** Formata horas do bloco de forma amigável (ex.: 0,75 → "45min", 1,5 → "1h30"). */
function fmtHorasBloco(h: number): string {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm}min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

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

function resolvePesoEdital(d: DisciplinaOption): number {
  const total = getDisciplinaTotalPontos({
    peso: d.peso ?? null,
    total_questoes_prova: d.total_questoes_prova ?? null,
    total_pontos: d.total_pontos ?? null,
  });
  return total ?? 1;
}

function priorityScore(pesoEdital: number, nivel: number) {
  return pesoEdital * (6 - nivel);
}

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
  const [minSessaoMin, setMinSessaoMin] = React.useState(0);
  const [diasSemana, setDiasSemana] = React.useState<number[]>([0, 1, 2, 3, 4]);
  const [dataInicio, setDataInicio] = React.useState(todayIso);
  const [dataFim, setDataFim] = React.useState(() => addWeeksIso(todayIso(), 4));
  const [rows, setRows] = React.useState<DisciplinaRow[]>([]);
  const [preview, setPreview] = React.useState<GerarResponse | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setHorasPorDia(2);
    setMinSessaoMin(0);
    setDiasSemana([0, 1, 2, 3, 4]);
    setDataInicio(todayIso());
    setDataFim(addWeeksIso(todayIso(), 4));
    setPreview(null);
    setRows(
      disciplinas.map((d) => ({
        disciplina_id: d.id,
        nome: d.nome,
        pesoEdital: resolvePesoEdital(d),
        nivel_conhecimento: 3,
        incluida: true,
        minSessaoMin: "",
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

  const includedRows = React.useMemo(() => rows.filter((r) => r.incluida), [rows]);

  const toggleIncluida = (id: string) => {
    setRows((cur) => cur.map((r) => (r.disciplina_id === id ? { ...r, incluida: !r.incluida } : r)));
    setPreview(null);
  };

  const updateRow = (
    id: string,
    patch: Partial<Pick<DisciplinaRow, "nivel_conhecimento" | "minSessaoMin">>,
  ) => {
    setRows((cur) => cur.map((r) => (r.disciplina_id === id ? { ...r, ...patch } : r)));
    setPreview(null);
  };

  /** minutos: null quando vazio (usa global), NaN quando inválido. */
  const parseMinSessao = (raw: string): number | null => {
    const t = raw.trim();
    if (!t) return null;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 0) return Number.NaN;
    return snapMinSessao(n);
  };

  const minutosPorDia = Math.round(horasPorDia * 60);

  const validate = (): string | null => {
    if (diasSemana.length === 0) return "Selecione pelo menos um dia da semana.";
    if (horasPorDia <= 0) return "Informe horas por dia maior que zero.";
    if (dataFim < dataInicio) return "A data de fim deve ser posterior à data de início.";
    if (includedRows.length === 0) return "Inclua ao menos uma disciplina no cronograma.";
    const capSemanalMin = minutosPorDia * diasSemana.length;
    let totalMin = 0;
    for (const r of includedRows) {
      if (r.nivel_conhecimento < 1 || r.nivel_conhecimento > 5) {
        return "Preencha o nível de conhecimento (1–5) para todas as disciplinas incluídas.";
      }
      const rowMin = parseMinSessao(r.minSessaoMin);
      if (rowMin != null && Number.isNaN(rowMin)) {
        return `Duração mínima inválida em "${r.nome}". Use minutos (0–60).`;
      }
      const minSessao = rowMin ?? minSessaoMin;
      if (minSessao > minutosPorDia) {
        return `"${r.nome}": duração mínima (${minSessao} min) não pode ser maior que horas por dia (${minutosPorDia} min).`;
      }
      totalMin += minSessao;
    }
    if (totalMin > capSemanalMin) {
      return `A soma dos mínimos por sessão (${totalMin} min) excede a capacidade semanal (${capSemanalMin} min). Inclua menos disciplinas ou aumente horas/dia.`;
    }
    return null;
  };

  const buildPayload = (salvar: boolean) => ({
    horas_por_dia: horasPorDia,
    duracao_minima_sessao_min: minSessaoMin,
    dias_semana: diasSemana,
    data_inicio: dataInicio,
    data_fim: dataFim,
    disciplinas: includedRows.map((r) => {
      const rowMin = parseMinSessao(r.minSessaoMin);
      const minResolvida = rowMin != null && !Number.isNaN(rowMin) ? rowMin : minSessaoMin;
      return {
        disciplina_id: r.disciplina_id,
        nivel_conhecimento: r.nivel_conhecimento,
        duracao_minima_sessao_min: minResolvida,
      };
    }),
    salvar,
  });

  const gerarMutation = useMutation({
    mutationFn: async (salvar: boolean) =>
      (await api.post("/cronograma/gerar-automatico", buildPayload(salvar))).data as GerarResponse,
    onSuccess: (data, salvar) => {
      setPreview(data);
      if (salvar) {
        toast.success(`Cronograma salvo — ${data.total_blocos} blocos, ${fmtHorasBloco(data.horas_totais)} no período.`);
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
                Distribui horas conforme o peso do edital e seu nível de conhecimento em cada matéria.
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
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                  Duração mínima por sessão (min)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MIN_SESSAO_MAX}
                  step={MIN_SESSAO_STEP}
                  value={minSessaoMin}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    setMinSessaoMin(Number.isFinite(raw) ? Math.min(MIN_SESSAO_MAX, Math.max(0, raw)) : 0);
                    setPreview(null);
                  }}
                  onBlur={(e) => setMinSessaoMin(snapMinSessao(Number(e.target.value)))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada bloco terá pelo menos esse tempo · 0 = 30 min · passos de 5 · máx. 60 min
                </p>
              </div>
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
              {rows.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {includedRows.length} de {rows.length} incluídas
                </span>
              ) : null}
            </div>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma disciplina no catálogo. Cadastre em <strong>Disciplinas &amp; Tópicos</strong>.
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((r) => {
                  const disc = disciplinas.find((d) => d.id === r.disciplina_id);
                  const score = priorityScore(r.pesoEdital, r.nivel_conhecimento);
                  return (
                  <li
                    key={r.disciplina_id}
                    className={cn(
                      "rounded-xl border bg-card p-3 shadow-sm transition-opacity",
                      r.incluida ? "border-border" : "border-dashed border-border/70 opacity-55",
                    )}
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary-600"
                          checked={r.incluida}
                          onChange={() => toggleIncluida(r.disciplina_id)}
                        />
                        <span className="min-w-0 truncate text-sm font-semibold text-card-foreground">{r.nome}</span>
                      </label>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                        {fmtPontos(r.pesoEdital)} pts edital
                        {disc?.peso != null && disc.total_questoes_prova != null ? (
                          <span className="ml-1">
                            ({fmtPeso(disc.peso)} × {disc.total_questoes_prova} q)
                          </span>
                        ) : null}
                      </span>
                    </div>
                    {r.incluida ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <ScaleField
                        label="Nível de conhecimento"
                        hint="1 = nunca vi · 5 = domínio total (quanto menor, mais tempo)"
                        value={r.nivel_conhecimento}
                        onChange={(v) => updateRow(r.disciplina_id, { nivel_conhecimento: v })}
                      />
                      <div className="min-w-[120px] flex-1">
                        <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                          Mín. por sessão (min)
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MIN_SESSAO_MAX}
                          step={MIN_SESSAO_STEP}
                          placeholder={minSessaoMin > 0 ? String(minSessaoMin) : "Padrão"}
                          value={r.minSessaoMin}
                          onChange={(e) => updateRow(r.disciplina_id, { minSessaoMin: e.target.value })}
                          onBlur={(e) => {
                            const t = e.target.value.trim();
                            if (t) updateRow(r.disciplina_id, { minSessaoMin: String(snapMinSessao(Number(t))) });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Vazio = usa o padrão global</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground sm:min-w-[120px]">
                        <span className="font-medium text-card-foreground">Prioridade</span>
                        <p className="mt-0.5 tabular-nums">{score.toFixed(1)}</p>
                        <p className="text-[10px]">peso edital × (6 − nível)</p>
                      </div>
                    </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Excluída do cronograma automático</p>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
          </section>

          {preview && previewSemanal ? (
            <section className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/20">
              <h3 className="text-sm font-semibold text-card-foreground">Prévia do padrão semanal</h3>
              <p className="text-xs text-muted-foreground">
                {preview.total_blocos} blocos no período · {fmtHorasBloco(preview.horas_totais)} totais
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DIAS_SEMANA.filter((d) => previewSemanal.has(String(d.value))).map((d) => (
                  <div key={d.value} className="rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs">
                    <p className="mb-1 font-semibold text-card-foreground">{d.full}</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {(previewSemanal.get(String(d.value)) ?? []).map((item) => (
                        <li key={item.nome} className="flex justify-between gap-2">
                          <span className="truncate">{item.nome}</span>
                          <span className="shrink-0 tabular-nums">{fmtHorasBloco(item.horas)}</span>
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
      </div>
    </div>,
    document.body,
  );
}
