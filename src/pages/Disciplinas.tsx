import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DisciplinaCard } from "@/components/disciplinas/DisciplinaCard";
import { getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";

type Disciplina = {
  id: string;
  concurso_id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  ordem: number;
  topicos_total?: number | null;
  topicos_estudados?: number | null;
};

type DisciplinaInput = {
  concurso_id: string;
  nome: string;
  sigla?: string | null;
  total_questoes_prova?: number | null;
  peso?: number | null;
  prioridade?: number | null;
  cor_hex?: string | null;
  ordem?: number | null;
};

export function Disciplinas() {
  const qc = useQueryClient();
  const planoAtivo = usePlanoAtivo();
  const planos = usePlanoStore((s) => s.planos);
  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const adicionarDisciplinaPlano = usePlanoStore((s) => s.adicionarDisciplina);
  const excluirDisciplinaPlano = usePlanoStore((s) => s.excluirDisciplina);

  const [planoDisciplinaMap, setPlanoDisciplinaMap] = React.useState<Record<string, string>>({});
  const [newDisciplinaNome, setNewDisciplinaNome] = React.useState("");
  const [editingDisciplina, setEditingDisciplina] = React.useState<Disciplina | null>(null);
  const [editingDisciplinaNome, setEditingDisciplinaNome] = React.useState("");
  const [deletingDisciplina, setDeletingDisciplina] = React.useState<Disciplina | null>(null);

  const refreshPlanoDisciplinaMap = React.useCallback(async () => {
    if (!planoAtivo?.id) {
      setPlanoDisciplinaMap({});
      return;
    }
    const rows = await listarPlanoDisciplinas(planoAtivo.id);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.disciplinaId] = r.id;
    setPlanoDisciplinaMap(map);
  }, [listarPlanoDisciplinas, planoAtivo?.id]);

  React.useEffect(() => {
    if (!planoAtivo && planos.length === 0) loadPlanos().catch(() => {});
  }, [loadPlanos, planoAtivo, planos.length]);

  React.useEffect(() => {
    refreshPlanoDisciplinaMap().catch(() => {});
  }, [refreshPlanoDisciplinaMap]);

  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const concursoId = concursoAtivoId ?? "";

  const { data: disciplinas = [], isLoading: loadingDisciplinas } = useQuery({
    queryKey: ["disciplinas", concursoId],
    enabled: Boolean(concursoId),
    queryFn: async () =>
      (await api.get(`/disciplinas?concurso_id=${concursoId}&include_topicos_stats=true`)).data as Disciplina[],
  });

  const createDisciplinaMutation = useMutation({
    mutationFn: async (payload: DisciplinaInput) => (await api.post("/disciplinas", payload)).data as Disciplina,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const updateDisciplinaMutation = useMutation({
    mutationFn: async (payload: { disciplinaId: string; nome: string }) =>
      (await api.put(`/disciplinas/${payload.disciplinaId}`, { nome: payload.nome })).data as Disciplina,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const deleteDisciplinaMutation = useMutation({
    mutationFn: async (disciplinaId: string) => {
      await api.delete(`/disciplinas/${disciplinaId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const togglePlanoMutation = useMutation({
    mutationFn: async (d: Disciplina) => {
      const rowId = planoDisciplinaMap[d.id];
      if (rowId) {
        await excluirDisciplinaPlano(rowId);
      } else if (planoAtivo?.id) {
        await adicionarDisciplinaPlano(planoAtivo.id, { disciplinaId: d.id });
      }
    },
    onSuccess: () => refreshPlanoDisciplinaMap(),
  });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-6 dark:border-neutral-700 dark:bg-card dark:shadow-none">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">Disciplinas & Tópicos</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie disciplinas e tópicos no mesmo padrão visual do sistema. O <strong className="text-foreground">plano de estudo</strong>{" "}
          (logo no topo) define o contexto do plano. O <strong className="text-foreground">concurso</strong> das disciplinas é o ativo na
          sua sessão — cadastre ou organize tópicos no <strong className="text-foreground">painel de cada disciplina</strong> ou concursos em{" "}
          <Link to="/concursos" className="font-medium text-primary underline-offset-4 hover:underline dark:text-primary-400">
            Meus Concursos
          </Link>
          .
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4 dark:border-neutral-700 dark:bg-muted/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:ring-offset-neutral-900"
            placeholder="Nova disciplina (ex: Direito Tributário)"
            value={newDisciplinaNome}
            onChange={(e) => setNewDisciplinaNome(e.target.value)}
          />
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            disabled={!concursoId || !newDisciplinaNome.trim() || createDisciplinaMutation.isPending}
            onClick={() => {
              const nome = newDisciplinaNome.trim();
              if (!nome || !concursoId) return;
              createDisciplinaMutation.mutate({
                concurso_id: concursoId,
                nome,
                sigla: null,
                total_questoes_prova: null,
                peso: null,
                prioridade: null,
                cor_hex: null,
                ordem: 0,
              });
              setNewDisciplinaNome("");
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {loadingDisciplinas ? <div className="text-sm text-muted-foreground">Carregando disciplinas...</div> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {disciplinas.map((disciplina) => {
          const total = disciplina.topicos_total ?? 0;
          const estudados = disciplina.topicos_estudados ?? 0;
          const stats = getTopicosProgressFromCounts(total, estudados);
          return (
            <DisciplinaCard
              key={disciplina.id}
              disciplina={disciplina}
              stats={stats}
              inPlano={Boolean(planoDisciplinaMap[disciplina.id])}
              canTogglePlano={Boolean(planoAtivo?.id)}
              onTogglePlano={() => togglePlanoMutation.mutate(disciplina)}
              onEdit={() => {
                setEditingDisciplina(disciplina);
                setEditingDisciplinaNome(disciplina.nome);
              }}
              onDelete={() => setDeletingDisciplina(disciplina)}
            />
          );
        })}
      </div>

      {editingDisciplina ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 dark:bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl dark:border-neutral-700">
            <div className="mb-3 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-base font-semibold">Editar disciplina</h3>
            </div>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={editingDisciplinaNome}
              onChange={(e) => setEditingDisciplinaNome(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm hover:bg-secondary dark:border-neutral-600"
                onClick={() => setEditingDisciplina(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={!editingDisciplinaNome.trim() || updateDisciplinaMutation.isPending}
                onClick={async () => {
                  await updateDisciplinaMutation.mutateAsync({ disciplinaId: editingDisciplina.id, nome: editingDisciplinaNome.trim() });
                  setEditingDisciplina(null);
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingDisciplina ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 dark:bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl dark:border-neutral-700">
            <div className="mb-3 flex items-center gap-2 text-danger-600 dark:text-danger-500">
              <Trash2 className="h-4 w-4" />
              <h3 className="text-base font-semibold">Excluir disciplina</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Confirma a exclusão de <strong className="text-foreground">{deletingDisciplina.nome}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm hover:bg-secondary dark:border-neutral-600"
                onClick={() => setDeletingDisciplina(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-danger-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={deleteDisciplinaMutation.isPending}
                onClick={async () => {
                  await deleteDisciplinaMutation.mutateAsync(deletingDisciplina.id);
                  setDeletingDisciplina(null);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
