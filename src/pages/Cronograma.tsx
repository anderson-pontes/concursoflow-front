import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Plus, Sparkles, Trash2, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import { GerarCronogramaAutoModal } from "@/components/cronograma/GerarCronogramaAutoModal";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { DIAS, diaAbrev, fmtHorasStats } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, FormState, SessaoStats } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

export function Cronograma() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();

  const jsDay = new Date().getDay(); // 0=Sun
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const { data: disciplinasCatalog = [], isLoading: loadingDisciplinas } = useQuery({
    queryKey: ["disciplinas", "catalog", null],
    queryFn: async () => {
      const rows = (await api.get("/disciplinas")).data as Array<{
        id: string;
        nome: string;
        peso: number | null;
        total_questoes_prova: number | null;
        total_pontos?: number | null;
        concurso_ids?: string[];
      }>;
      return rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        peso: r.peso,
        total_questoes_prova: r.total_questoes_prova,
        total_pontos: r.total_pontos,
        concurso_ids: r.concurso_ids,
      })) as DisciplinaOption[];
    },
  });

  /** Catálogo completo; com concurso ativo, prioriza vinculadas ao concurso no topo. */
  const disciplinas = React.useMemo(() => {
    if (!concursoAtivoId) return disciplinasCatalog;
    const linked = disciplinasCatalog.filter((d) => d.concurso_ids?.includes(concursoAtivoId));
    const rest = disciplinasCatalog.filter((d) => !d.concurso_ids?.includes(concursoAtivoId));
    return linked.length > 0 ? [...linked, ...rest] : disciplinasCatalog;
  }, [disciplinasCatalog, concursoAtivoId]);
  const discMap = React.useMemo(() => new Map(disciplinas.map((d) => [d.id, d.nome])), [disciplinas]);

  const { data: blocos, isLoading } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as Bloco[],
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

  const limparMutation = useMutation({
    mutationFn: async () =>
      (await api.delete("/cronograma/limpar")).data as { blocos_removidos: number; itens_removidos: number },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success(
        `Cronograma limpo — ${data.blocos_removidos} bloco(s) e ${data.itens_removidos} item(ns) removidos.`,
      );
    },
    onError: () => toast.error("Não foi possível limpar o cronograma."),
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [editBloco, setEditBloco] = React.useState<Bloco | null>(null);
  const [openRegistro, setOpenRegistro] = React.useState(false);

  const grouped = React.useMemo(() => {
    const map = Object.fromEntries(DIAS.map((d) => [d, [] as Bloco[]])) as Record<Bloco["dia_semana"], Bloco[]>;
    for (const b of blocos ?? []) map[b.dia_semana]?.push(b);
    return map;
  }, [blocos]);

  const groupedPorDisciplina = React.useMemo(() => {
    return Object.fromEntries(
      DIAS.map((d) => [
        d,
        [...(grouped[d] ?? [])].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
      ]),
    ) as Record<Bloco["dia_semana"], Bloco[]>;
  }, [grouped]);

  const totalBlocos = (blocos ?? []).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Cronograma</h1>
          <p className="text-sm text-muted-foreground">Planejamento semanal de estudos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/estudos/calendario"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted"
          >
            <Calendar className="h-4 w-4" />
            Calendário mensal
          </Link>
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
              if (loadingDisciplinas) {
                toast.info("Carregando disciplinas…");
                return;
              }
              if (disciplinas.length === 0) {
                toast.error("Nenhuma disciplina no catálogo. Cadastre em Disciplinas & Tópicos.");
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
            disabled={limparMutation.isPending}
            onClick={() => {
              if (
                !window.confirm(
                  "Isso remove todos os blocos do cronograma semanal e os itens gerados automaticamente. Deseja continuar?",
                )
              ) {
                return;
              }
              limparMutation.mutate();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {limparMutation.isPending ? "Limpando…" : "Limpar cronograma"}
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
            const items = groupedPorDisciplina[dia] ?? [];
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
                    {isHoje ? <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">hoje</span> : null}
                  </span>
                  {items.length > 0 ? (
                    <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {items.map((bloco) => (
                    <CronogramaBlocoCard
                      key={bloco.id}
                      bloco={bloco}
                      disciplinaNome={discMap.get(bloco.disciplina_id) ?? "—"}
                      diaLabel={diaAbrev[dia]}
                      onEdit={() => setEditBloco(bloco)}
                      onDelete={() => deleteMutation.mutate(bloco.id)}
                      deletePending={deleteMutation.isPending}
                    />
                  ))}
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Sem blocos</p>
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
