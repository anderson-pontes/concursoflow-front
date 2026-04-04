import React from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Pencil, Plus, Trash2, X, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { cn } from "@/lib/utils";

type DisciplinaOption = { id: string; nome: string };

type Bloco = {
  id: string;
  user_id: string;
  disciplina_id: string;
  dia_semana: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
};

type SessaoStats = {
  tempo_total_horas?: number;
  sessoes_count?: number;
  media_diaria_horas?: number;
  [key: string]: unknown;
};

const DIAS: Bloco["dia_semana"][] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const diaLabels: Record<Bloco["dia_semana"], string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};
const diaAbrev: Record<Bloco["dia_semana"], string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};
const diaIndex: Record<Bloco["dia_semana"], number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
};

type TipoBadge = { label: string; cls: string };
const tipoMap: Record<string, TipoBadge> = {
  estudo: { label: "Estudo", cls: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" },
  revisao: { label: "Revisão", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  questoes: { label: "Questões", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  livre: { label: "Livre", cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" },
  pomodoro: { label: "Pomodoro", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};
function getTipo(tipo: string): TipoBadge {
  return tipoMap[tipo.toLowerCase()] ?? { label: tipo, cls: "bg-neutral-100 text-neutral-500" };
}

function fmtHorasStats(h: number | undefined): string {
  if (!h || h <= 0) return "—";
  const totalMin = Math.round(h * 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${hrs}h ${min}min` : `${hrs}h`;
}

type FormState = {
  disciplina_id: string;
  dia_semana: Bloco["dia_semana"];
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
};

const defaultForm: FormState = {
  disciplina_id: "",
  dia_semana: "seg",
  hora_inicio: "08:00",
  hora_fim: "09:00",
  tipo: "estudo",
  ativo: true,
};

function BlocoFormModal({
  open,
  onClose,
  onSave,
  disciplinas,
  initialValues,
  title,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: FormState) => void;
  disciplinas: DisciplinaOption[];
  initialValues?: Partial<FormState>;
  title: string;
  isSaving: boolean;
}) {
  const [form, setForm] = React.useState<FormState>({ ...defaultForm, ...initialValues });

  React.useEffect(() => {
    if (open) setForm({ ...defaultForm, ...initialValues });
  }, [open, initialValues]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const horaFimInvalida = form.hora_fim <= form.hora_inicio;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              value={form.disciplina_id}
              onChange={(e) => setForm((s) => ({ ...s, disciplina_id: e.target.value }))}
            >
              <option value="" disabled>Selecione...</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Dia</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.dia_semana}
                onChange={(e) => setForm((s) => ({ ...s, dia_semana: e.target.value as Bloco["dia_semana"] }))}
              >
                {DIAS.map((k) => <option key={k} value={k}>{diaLabels[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Tipo</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.tipo}
                onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
              >
                {Object.entries(tipoMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Início</label>
              <input
                type="time"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.hora_inicio}
                onChange={(e) => setForm((s) => ({ ...s, hora_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Fim</label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500 bg-background",
                  horaFimInvalida ? "border-danger-400" : "border-border",
                )}
                value={form.hora_fim}
                onChange={(e) => setForm((s) => ({ ...s, hora_fim: e.target.value }))}
              />
              {horaFimInvalida ? <p className="mt-1 text-xs text-danger-600">Fim deve ser após o início.</p> : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!form.disciplina_id || horaFimInvalida || isSaving}
            onClick={() => onSave(form)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Cronograma() {
  const qc = useQueryClient();
  const planoAtivo = usePlanoAtivo();
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const planoIdParam =
    planoAtivo?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planoAtivo.id)
      ? planoAtivo.id
      : undefined;

  const hoje = DIAS[((new Date().getDay() + 6) % 7)] as Bloco["dia_semana"]; // 0=dom fix to seg-based

  // Actually use JS getDay() properly: 0=Sun,1=Mon...6=Sat
  const jsDay = new Date().getDay(); // 0=Sun
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const { data: disciplinasGlobais } = useQuery({
    queryKey: ["disciplinas-all"],
    enabled: !planoIdParam,
    queryFn: async () => {
      const rows = (await api.get("/disciplinas")).data as Array<{ id: string; nome: string }>;
      return rows.map((r) => ({ id: r.id, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const { data: disciplinasDoPlano } = useQuery({
    queryKey: ["disciplinas-do-plano", planoIdParam ?? null],
    enabled: Boolean(planoIdParam),
    queryFn: async () => {
      if (!planoIdParam) return [] as DisciplinaOption[];
      const rows = await listarPlanoDisciplinas(planoIdParam);
      return rows.map((r) => ({ id: r.disciplinaId, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const disciplinas = (planoIdParam ? disciplinasDoPlano : disciplinasGlobais) ?? [];
  const discMap = React.useMemo(() => new Map(disciplinas.map((d) => [d.id, d.nome])), [disciplinas]);

  const { data: blocos, isLoading } = useQuery({
    queryKey: ["cronograma-blocos", planoIdParam ?? null],
    queryFn: async () => {
      const params = planoIdParam ? { plano_id: planoIdParam } : undefined;
      return (await api.get("/cronograma/blocos", { params })).data as Bloco[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["sessoes-stats", planoIdParam ?? null],
    queryFn: async () => {
      const params = planoIdParam ? { plano_id: planoIdParam } : undefined;
      return (await api.get("/sessoes-estudo/stats", { params })).data as SessaoStats;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) =>
      (await api.post("/cronograma/blocos", { ...payload, plano_id: planoIdParam ?? undefined })).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", planoIdParam ?? null] });
      toast.success("Bloco criado.");
      setCreateOpen(false);
    },
    onError: () => toast.error("Erro ao criar bloco."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormState }) =>
      (await api.put(`/cronograma/blocos/${id}`, payload)).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", planoIdParam ?? null] });
      toast.success("Bloco atualizado.");
      setEditBloco(null);
    },
    onError: () => toast.error("Erro ao atualizar bloco."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/cronograma/blocos/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", planoIdParam ?? null] });
      toast.success("Bloco removido.");
    },
    onError: () => toast.error("Erro ao remover bloco."),
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editBloco, setEditBloco] = React.useState<Bloco | null>(null);
  const [openRegistro, setOpenRegistro] = React.useState(false);

  const grouped = React.useMemo(() => {
    const map = Object.fromEntries(DIAS.map((d) => [d, [] as Bloco[]])) as Record<Bloco["dia_semana"], Bloco[]>;
    for (const b of blocos ?? []) map[b.dia_semana]?.push(b);
    for (const k of DIAS) map[k].sort((a, c) => a.hora_inicio.localeCompare(c.hora_inicio));
    return map;
  }, [blocos]);

  const totalBlocos = (blocos ?? []).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Cronograma</h1>
          <p className="text-sm text-muted-foreground">Planejamento semanal de estudos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenRegistro(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted"
          >
            <BookOpen className="h-4 w-4" />
            Novo registro
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Novo bloco
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Tempo total", value: fmtHorasStats(stats.tempo_total_horas), icon: Clock },
            { label: "Sessões", value: stats.sessoes_count != null ? String(stats.sessoes_count) : "—", icon: BarChart3 },
            { label: "Média diária", value: fmtHorasStats(stats.media_diaria_horas), icon: Calendar },
            { label: "Blocos no cronograma", value: String(totalBlocos), icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="truncate text-base font-semibold tabular-nums text-card-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Grid semanal */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-7">
          {DIAS.map((d) => (
            <div key={d} className="h-40 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {DIAS.map((dia) => {
            const isHoje = dia === diaHoje;
            const blocks = grouped[dia] ?? [];
            return (
              <div
                key={dia}
                className={cn(
                  "rounded-xl border p-3",
                  isHoje
                    ? "border-primary-400 bg-primary-50/60 shadow-sm dark:border-primary-600 dark:bg-primary-950/30"
                    : "border-border bg-card",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      isHoje ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground",
                    )}
                  >
                    {diaAbrev[dia]}
                    {isHoje ? <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white">hoje</span> : null}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{blocks.length > 0 ? `${blocks.length}` : ""}</span>
                </div>

                <div className="space-y-2">
                  {blocks.map((b) => {
                    const badge = getTipo(b.tipo);
                    const discNome = discMap.get(b.disciplina_id) ?? "—";
                    return (
                      <div
                        key={b.id}
                        className="group relative overflow-hidden rounded-lg border border-border bg-white p-2.5 shadow-sm dark:bg-neutral-900"
                      >
                        <p className="truncate text-[11px] font-semibold tabular-nums text-card-foreground">
                          {b.hora_inicio} – {b.hora_fim}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{discNome}</p>
                        <span className={cn("mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.cls)}>
                          {badge.label}
                        </span>
                        <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            title="Editar bloco"
                            onClick={() => setEditBloco(b)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Excluir bloco"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Excluir o bloco de ${b.hora_inicio} – ${b.hora_fim}?`)) {
                                deleteMutation.mutate(b.id);
                              }
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {blocks.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-muted-foreground">Sem blocos</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar */}
      <BlocoFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(form) => createMutation.mutate(form)}
        disciplinas={disciplinas}
        title="Novo bloco de estudo"
        isSaving={createMutation.isPending}
      />

      {/* Modal editar */}
      {editBloco ? (
        <BlocoFormModal
          open
          onClose={() => setEditBloco(null)}
          onSave={(form) => updateMutation.mutate({ id: editBloco.id, payload: form })}
          disciplinas={disciplinas}
          initialValues={{
            disciplina_id: editBloco.disciplina_id,
            dia_semana: editBloco.dia_semana,
            hora_inicio: editBloco.hora_inicio,
            hora_fim: editBloco.hora_fim,
            tipo: editBloco.tipo,
            ativo: editBloco.ativo,
          }}
          title="Editar bloco de estudo"
          isSaving={updateMutation.isPending}
        />
      ) : null}

      <RegistroEstudoModal
        open={openRegistro}
        onClose={() => setOpenRegistro(false)}
        defaultDisciplinaId={null}
      />
    </div>
  );
}
