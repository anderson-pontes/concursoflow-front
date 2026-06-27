import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Pencil, Plus, Sparkles, Trash2, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";

import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import { GerarCronogramaAutoModal } from "@/components/cronograma/GerarCronogramaAutoModal";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { DIAS, diaAbrev, fmtHorasStats, getTipo } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, FormState, SessaoStats } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

export function Cronograma() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();

  const jsDay = new Date().getDay(); // 0=Sun
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const { data: disciplinasGlobais } = useQuery({
    queryKey: ["disciplinas-all"],
    enabled: !concursoAtivoId,
    queryFn: async () => {
      const rows = (await api.get("/disciplinas")).data as Array<{ id: string; nome: string }>;
      return rows.map((r) => ({ id: r.id, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const { data: disciplinasDoConcurso } = useQuery({
    queryKey: ["disciplinas-do-concurso", concursoAtivoId ?? null],
    enabled: Boolean(concursoAtivoId),
    queryFn: async () => {
      const rows = (await api.get("/disciplinas", { params: { concurso_id: concursoAtivoId } })).data as Array<{
        id: string;
        nome: string;
      }>;
      return rows.map((r) => ({ id: r.id, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const disciplinas = (concursoAtivoId ? disciplinasDoConcurso : disciplinasGlobais) ?? [];
  const discMap = React.useMemo(() => new Map(disciplinas.map((d) => [d.id, d.nome])), [disciplinas]);

  const { data: blocos, isLoading } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/cronograma/blocos")).data as Bloco[],
  });

  const { data: stats } = useQuery({
    queryKey: ["sessoes-stats", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/sessoes-estudo/stats")).data as SessaoStats,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) =>
      (await api.post("/cronograma/blocos", payload)).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success("Bloco criado.");
      setCreateOpen(false);
    },
    onError: () => toast.error("Erro ao criar bloco."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormState }) =>
      (await api.put(`/cronograma/blocos/${id}`, payload)).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success("Bloco atualizado.");
      setEditBloco(null);
    },
    onError: () => toast.error("Erro ao atualizar bloco."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/cronograma/blocos/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success("Bloco removido.");
    },
    onError: () => toast.error("Erro ao remover bloco."),
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [autoOpen, setAutoOpen] = React.useState(false);
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
            onClick={() => {
              if (disciplinas.length === 0) {
                toast.error("Cadastre disciplinas antes de gerar o cronograma automático.");
                return;
              }
              setAutoOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/40"
          >
            <Sparkles className="h-4 w-4" />
            Gerar automático
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

      <BlocoFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(form) => createMutation.mutate(form)}
        disciplinas={disciplinas}
        title="Novo bloco de estudo"
        isSaving={createMutation.isPending}
      />

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

      <GerarCronogramaAutoModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        disciplinas={disciplinas}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
        }}
      />

      <RegistroEstudoModal
        open={openRegistro}
        onClose={() => setOpenRegistro(false)}
        defaultDisciplinaId={null}
      />
    </div>
  );
}
