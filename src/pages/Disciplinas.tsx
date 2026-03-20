import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "@/services/api";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";

type Concurso = {
  id: string;
  user_id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  status: string;
  created_at: string;
};

type Disciplina = {
  id: string;
  concurso_id: string;
  nome: string;
  sigla: string | null;
  total_questoes_prova: number | null;
  peso: number | null;
  prioridade: number | null;
  cor_hex: string | null;
  ordem: number;
  created_at: string;
};

type Topico = {
  id: string;
  disciplina_id: string;
  descricao: string;
  status: "nao_iniciado" | "em_andamento" | "revisao" | "dominado";
  numero_ordem: number;
  created_at: string;
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

type TopicoInput = {
  descricao: string;
  status?: Topico["status"] | null;
  numero_ordem?: number | null;
};

const statusOptions: Topico["status"][] = ["nao_iniciado", "em_andamento", "revisao", "dominado"];

export function Disciplinas() {
  const qc = useQueryClient();

  const planoAtivo = usePlanoAtivo();
  const planos = usePlanoStore((s) => s.planos);
  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const adicionarDisciplina = usePlanoStore((s) => s.adicionarDisciplina);
  const excluirDisciplina = usePlanoStore((s) => s.excluirDisciplina);

  const [planoDisciplinaMap, setPlanoDisciplinaMap] = React.useState<Record<string, string>>({});

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
    if (!planoAtivo && planos.length === 0) {
      loadPlanos().catch(() => {});
    }
  }, [loadPlanos, planoAtivo, planos.length]);

  React.useEffect(() => {
    refreshPlanoDisciplinaMap().catch(() => {});
  }, [refreshPlanoDisciplinaMap]);

  const { data: concursos, isLoading: loadingConcursos } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  const defaultConcursoId = concursos?.[0]?.id ?? "";
  const [concursoId, setConcursoId] = React.useState<string>(defaultConcursoId);

  React.useEffect(() => {
    if (!defaultConcursoId) return;
    const selectedStillExists = (concursos ?? []).some((c) => c.id === concursoId);
    if (!concursoId || !selectedStillExists) setConcursoId(defaultConcursoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultConcursoId, concursos, concursoId]);

  const { data: disciplinas, isLoading: loadingDisciplinas } = useQuery({
    queryKey: ["disciplinas", concursoId],
    enabled: Boolean(concursoId),
    queryFn: async () => (await api.get(`/disciplinas?concurso_id=${concursoId}`)).data as Disciplina[],
  });

  const updateTopicoMutation = useMutation({
    mutationFn: async (payload: { disciplinaId: string; topicoId: string; data: Partial<TopicoInput> }) => {
      const { disciplinaId, topicoId, data } = payload;
      const res = await api.put(`/disciplinas/${disciplinaId}/topicos/${topicoId}`, data);
      return res.data as Topico;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] });
      qc.invalidateQueries({ queryKey: ["topicos", vars.disciplinaId] });
    },
  });

  const createDisciplinaMutation = useMutation({
    mutationFn: async (payload: DisciplinaInput) => {
      const res = await api.post("/disciplinas", payload);
      return res.data as Disciplina;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const updateDisciplinaMutation = useMutation({
    mutationFn: async (payload: { disciplinaId: string; nome: string }) => {
      const res = await api.put(`/disciplinas/${payload.disciplinaId}`, { nome: payload.nome });
      return res.data as Disciplina;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const deleteDisciplinaMutation = useMutation({
    mutationFn: async (disciplinaId: string) => {
      await api.delete(`/disciplinas/${disciplinaId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] }),
  });

  const createTopicoMutation = useMutation({
    mutationFn: async (payload: { disciplinaId: string; data: TopicoInput }) => {
      const res = await api.post(`/disciplinas/${payload.disciplinaId}/topicos`, payload.data);
      return res.data as Topico;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] });
      qc.invalidateQueries({ queryKey: ["topicos", vars.disciplinaId] });
    },
  });

  const deleteTopicoMutation = useMutation({
    mutationFn: async (payload: { disciplinaId: string; topicoId: string }) => {
      await api.delete(`/disciplinas/${payload.disciplinaId}/topicos/${payload.topicoId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["disciplinas", concursoId] });
      qc.invalidateQueries({ queryKey: ["topicos", vars.disciplinaId] });
    },
  });

  const adicionarAoPlanoMutation = useMutation({
    mutationFn: async (disciplinaGlobalId: string) => {
      if (!planoAtivo?.id) throw new Error("Nenhum plano ativo");
      const created = await adicionarDisciplina(planoAtivo.id, { disciplinaId: disciplinaGlobalId });
      return created;
    },
    onSuccess: () => refreshPlanoDisciplinaMap(),
  });

  const removerDoPlanoMutation = useMutation({
    mutationFn: async (planoDisciplinaRowId: string) => {
      await excluirDisciplina(planoDisciplinaRowId);
    },
    onSuccess: () => refreshPlanoDisciplinaMap(),
  });

  const [newDisciplinaNome, setNewDisciplinaNome] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [topicoDrafts, setTopicoDrafts] = React.useState<Record<string, TopicoInput>>({});
  const [editingDisciplina, setEditingDisciplina] = React.useState<Disciplina | null>(null);
  const [editingDisciplinaNome, setEditingDisciplinaNome] = React.useState("");
  const [deletingDisciplina, setDeletingDisciplina] = React.useState<Disciplina | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Disciplinas & Tópicos</h2>
          <p className="text-sm text-muted-foreground">Organize o conteúdo por concurso e avance por status.</p>
        </div>

        <div className="flex items-center gap-2">
          {loadingConcursos ? (
            <div className="text-sm text-muted-foreground">Carregando concursos...</div>
          ) : (
            <select
              className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm"
              value={concursoId}
              onChange={(e) => setConcursoId(e.target.value)}
            >
              {(concursos ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="flex-1 rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
            placeholder="Nova disciplina (nome)"
            value={newDisciplinaNome}
            onChange={(e) => setNewDisciplinaNome(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
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
            + Adicionar
          </button>
        </div>
        {!concursoId && !loadingConcursos ? (
          <div className="mt-2 text-xs text-warning-700">
            Selecione ou crie um concurso para habilitar o cadastro de disciplina.
          </div>
        ) : null}
      </div>

      {loadingDisciplinas ? <div className="text-sm text-muted-foreground">Carregando disciplinas...</div> : null}

      {disciplinas ? (
        <div className="space-y-3">
          {disciplinas.map((d) => {
            const isOpen = Boolean(expanded[d.id]);
            const planoDisciplinaRowId = planoDisciplinaMap[d.id];
            const estaNoPlano = Boolean(planoDisciplinaRowId);
            return (
              <div key={d.id} className="rounded-xl border border-border/40 bg-background/70 p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-500" />
                      <div className="truncate text-sm font-semibold">{d.nome}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {d.sigla ? <span className="rounded bg-muted px-1.5 py-0.5">{d.sigla}</span> : null}
                      <span>Ordem: {d.ordem}</span>
                      {d.peso ? <span>Peso: {d.peso}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {planoAtivo?.id ? (
                      estaNoPlano ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2 py-1 text-[11px] font-medium text-danger-600 hover:bg-danger-100 disabled:opacity-60"
                          disabled={removerDoPlanoMutation.isPending}
                          onClick={() => removerDoPlanoMutation.mutate(planoDisciplinaRowId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover do plano
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-800 hover:bg-primary-100 disabled:opacity-60"
                          disabled={adicionarAoPlanoMutation.isPending}
                          onClick={() => adicionarAoPlanoMutation.mutate(d.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar ao plano
                        </button>
                      )
                    ) : null}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-background px-2 py-1.5 text-xs hover:bg-muted"
                        onClick={() => {
                          setEditingDisciplina(d);
                          setEditingDisciplinaNome(d.nome);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-100"
                        onClick={() => setDeletingDisciplina(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between rounded-lg border border-border/40 bg-background px-3 py-2">
                  <span className="text-xs text-muted-foreground">Gerenciar tópicos da disciplina</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    onClick={() => setExpanded((s) => ({ ...s, [d.id]: !isOpen }))}
                  >
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isOpen ? "Ocultar tópicos" : "Mostrar tópicos"}
                  </button>
                </div>

                {isOpen ? (
                  <div className="mt-4 space-y-3">
                    <Topicos
                      disciplinaId={d.id}
                      concursoId={concursoId}
                      onCreate={createTopicoMutation.mutateAsync}
                      updateTopico={updateTopicoMutation.mutateAsync}
                      deleteTopico={deleteTopicoMutation.mutateAsync}
                      topicoDrafts={topicoDrafts}
                      setTopicoDrafts={setTopicoDrafts}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {editingDisciplina ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-background p-5 shadow-xl">
            <div className="mb-3">
              <h3 className="text-base font-semibold">Editar disciplina</h3>
              <p className="text-xs text-muted-foreground">Atualize o nome da disciplina.</p>
            </div>
            <input
              className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={editingDisciplinaNome}
              onChange={(e) => setEditingDisciplinaNome(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setEditingDisciplina(null)}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
                disabled={!editingDisciplinaNome.trim() || updateDisciplinaMutation.isPending}
                onClick={async () => {
                  if (!editingDisciplina) return;
                  await updateDisciplinaMutation.mutateAsync({
                    disciplinaId: editingDisciplina.id,
                    nome: editingDisciplinaNome.trim(),
                  });
                  setEditingDisciplina(null);
                }}
              >
                <Pencil className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingDisciplina ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-background p-5 shadow-xl">
            <div className="mb-2 text-base font-semibold text-danger-600">Excluir disciplina</div>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>{deletingDisciplina.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setDeletingDisciplina(null)}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-danger-600 px-3 py-2 text-sm font-medium text-white hover:bg-danger-800 disabled:opacity-60"
                disabled={deleteDisciplinaMutation.isPending}
                onClick={async () => {
                  if (!deletingDisciplina) return;
                  await deleteDisciplinaMutation.mutateAsync(deletingDisciplina.id);
                  setDeletingDisciplina(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Topicos({
  disciplinaId,
  onCreate,
  updateTopico,
  deleteTopico,
  topicoDrafts,
  setTopicoDrafts,
}: {
  disciplinaId: string;
  concursoId: string;
  onCreate: (payload: { disciplinaId: string; data: TopicoInput }) => Promise<Topico>;
  updateTopico: (payload: { disciplinaId: string; topicoId: string; data: Partial<TopicoInput> }) => Promise<Topico>;
  deleteTopico: (payload: { disciplinaId: string; topicoId: string }) => Promise<void>;
  topicoDrafts: Record<string, TopicoInput>;
  setTopicoDrafts: React.Dispatch<React.SetStateAction<Record<string, TopicoInput>>>;
}) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingDescricao, setEditingDescricao] = React.useState("");
  const [editingOrdem, setEditingOrdem] = React.useState<number>(0);

  const { data, isLoading } = useQuery({
    queryKey: ["topicos", disciplinaId],
    queryFn: async () => (await api.get(`/disciplinas/${disciplinaId}/topicos`)).data as Topico[],
    enabled: Boolean(disciplinaId),
  });

  const draft: TopicoInput = topicoDrafts[disciplinaId] ?? { descricao: "", status: "nao_iniciado", numero_ordem: 0 };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/40 bg-background/70 p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="sm:col-span-2 rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
            placeholder="Novo tópico (descrição)"
            value={draft.descricao}
            onChange={(e) => setTopicoDrafts((s) => ({ ...s, [disciplinaId]: { ...draft, descricao: e.target.value } }))}
          />
          <button
            type="button"
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
            disabled={!draft.descricao.trim() || isLoading}
            onClick={async () => {
              const raw = draft.descricao.trim();
              if (!raw) return;
              const partes = raw
                .split(";")
                .map((x) => x.trim())
                .filter(Boolean);
              const unicos = Array.from(new Set(partes));
              for (const descricao of unicos) {
                // Criação sequencial evita estourar requests simultâneas.
                await onCreate({
                  disciplinaId,
                  data: {
                    descricao,
                    status: draft.status ?? "nao_iniciado",
                    numero_ordem: draft.numero_ordem ?? 0,
                  },
                });
              }
              setTopicoDrafts((s) => ({ ...s, [disciplinaId]: { ...draft, descricao: "" } }));
            }}
          >
            + Criar
          </button>
        </div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Carregando tópicos...</div> : null}

      {data ? (
        <div className="space-y-2">
          {data.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-background p-3">
              <div className="min-w-0 flex-1">
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg border border-border/40 bg-background px-2 py-2 text-sm outline-none"
                      value={editingDescricao}
                      onChange={(e) => setEditingDescricao(e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-28 rounded-lg border border-border/40 bg-background px-2 py-2 text-sm outline-none"
                      value={editingOrdem}
                      onChange={(e) => setEditingOrdem(Number(e.target.value))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="line-clamp-2 text-sm font-medium">{t.descricao}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Ordem: {t.numero_ordem}</div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <select
                  className="rounded-lg border border-border/40 bg-background px-2 py-2 text-sm outline-none"
                  value={t.status}
                  onChange={async (e) => {
                    await updateTopico({ disciplinaId, topicoId: t.id, data: { status: e.target.value as TopicoInput["status"] } });
                    qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
                  }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {editingId === t.id ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-primary-600 px-2 py-1 text-xs text-white"
                      onClick={async () => {
                        await updateTopico({
                          disciplinaId,
                          topicoId: t.id,
                          data: { descricao: editingDescricao, numero_ordem: editingOrdem },
                        });
                        setEditingId(null);
                        qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
                      }}
                    >
                      Salvar
                    </button>
                    <button type="button" className="rounded-md border border-border/40 px-2 py-1 text-xs" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border/40 px-2 py-1 text-xs"
                      onClick={() => {
                        setEditingId(t.id);
                        setEditingDescricao(t.descricao);
                        setEditingOrdem(t.numero_ordem);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-danger-50 px-2 py-1 text-xs text-danger-600"
                      onClick={async () => {
                        const ok = window.confirm("Excluir tópico?");
                        if (!ok) return;
                        await deleteTopico({ disciplinaId, topicoId: t.id });
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

