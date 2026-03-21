import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

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
};

type Topico = {
  id: string;
  disciplina_id: string;
  descricao: string;
  status: "nao_iniciado" | "em_andamento" | "revisao" | "dominado";
  numero_ordem: number;
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

function calcTopicosStats(items: Topico[]) {
  const total = items.length;
  const studied = items.filter((t) => t.status === "dominado" || t.status === "revisao").length;
  const pct = total > 0 ? Math.round((studied / total) * 100) : 0;
  return { total, studied, pct };
}

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
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
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
    queryFn: async () => (await api.get(`/disciplinas?concurso_id=${concursoId}`)).data as Disciplina[],
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
          sua sessão — cadastre ou organize em{" "}
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
        {disciplinas.map((disciplina) => (
          <DisciplinaCard
            key={disciplina.id}
            disciplina={disciplina}
            concursoId={concursoId}
            isOpen={Boolean(expanded[disciplina.id])}
            onToggleOpen={() => setExpanded((s) => ({ ...s, [disciplina.id]: !s[disciplina.id] }))}
            inPlano={Boolean(planoDisciplinaMap[disciplina.id])}
            canTogglePlano={Boolean(planoAtivo?.id)}
            onTogglePlano={() => togglePlanoMutation.mutate(disciplina)}
            onEdit={() => {
              setEditingDisciplina(disciplina);
              setEditingDisciplinaNome(disciplina.nome);
            }}
            onDelete={() => setDeletingDisciplina(disciplina)}
          />
        ))}
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

function DisciplinaCard({
  disciplina,
  concursoId,
  isOpen,
  onToggleOpen,
  inPlano,
  canTogglePlano,
  onTogglePlano,
  onEdit,
  onDelete,
}: {
  disciplina: Disciplina;
  concursoId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  inPlano: boolean;
  canTogglePlano: boolean;
  onTogglePlano: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = actionsMenuRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const { data: topicos = [] } = useQuery({
    queryKey: ["topicos", disciplina.id],
    queryFn: async () => (await api.get(`/disciplinas/${disciplina.id}/topicos`)).data as Topico[],
    enabled: Boolean(disciplina.id),
  });

  const stats = calcTopicosStats(topicos);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm dark:border-neutral-700 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <h3 className="truncate text-sm font-semibold text-foreground">{disciplina.nome}</h3>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {disciplina.sigla ? `${disciplina.sigla} • ` : ""}Ordem {disciplina.ordem}
            {disciplina.peso ? ` • Peso ${disciplina.peso}` : ""}
          </div>
        </div>
        <div className="relative" ref={actionsMenuRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:bg-muted dark:border-neutral-600"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md dark:border-neutral-600 dark:bg-neutral-900">
              <Link
                to={`/disciplinas/${disciplina.id}`}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted dark:hover:bg-neutral-800"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Painel da disciplina
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted dark:hover:bg-neutral-800"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {stats.studied}/{stats.total} tópicos estudados
          </span>
          <span>{stats.pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted dark:bg-neutral-800">
          <div className="h-full rounded-full bg-primary-600 transition-all dark:bg-primary-500" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canTogglePlano}
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            inPlano
              ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-muted text-muted-foreground dark:bg-neutral-800 dark:text-neutral-300",
            !canTogglePlano ? "opacity-60" : "",
          ].join(" ")}
          onClick={onTogglePlano}
        >
          {inPlano ? "No plano" : "Fora do plano"}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          onClick={onToggleOpen}
        >
          {isOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0 opacity-90" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" />}
          {isOpen ? "Ocultar tópicos" : "Mostrar tópicos"}
        </button>
      </div>

      {isOpen ? <Topicos disciplinaId={disciplina.id} concursoId={concursoId} /> : null}
    </div>
  );
}

function Topicos({ disciplinaId }: { disciplinaId: string; concursoId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<TopicoInput>({ descricao: "", status: "nao_iniciado", numero_ordem: 0 });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingDescricao, setEditingDescricao] = React.useState("");
  const [editingOrdem, setEditingOrdem] = React.useState<number>(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["topicos", disciplinaId],
    queryFn: async () => (await api.get(`/disciplinas/${disciplinaId}/topicos`)).data as Topico[],
    enabled: Boolean(disciplinaId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: TopicoInput) =>
      (await api.post(`/disciplinas/${disciplinaId}/topicos`, payload)).data as Topico,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { topicoId: string; data: Partial<TopicoInput> }) =>
      (await api.put(`/disciplinas/${disciplinaId}/topicos/${payload.topicoId}`, payload.data)).data as Topico,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (topicoId: string) => {
      await api.delete(`/disciplinas/${disciplinaId}/topicos/${topicoId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] }),
  });

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/50 p-3 dark:border-neutral-700 dark:bg-muted/25">
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:ring-offset-neutral-900"
          placeholder="Novo tópico (use ; para criar vários)"
          value={draft.descricao}
          onChange={(e) => setDraft((s) => ({ ...s, descricao: e.target.value }))}
        />
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          disabled={!draft.descricao.trim() || createMutation.isPending}
          onClick={async () => {
            const parts = Array.from(new Set(draft.descricao.split(";").map((x) => x.trim()).filter(Boolean)));
            for (const descricao of parts) {
              await createMutation.mutateAsync({ descricao, status: draft.status, numero_ordem: draft.numero_ordem });
            }
            setDraft((s) => ({ ...s, descricao: "" }));
          }}
        >
          <Plus className="h-4 w-4" />
          Criar
        </button>
      </div>

      {isLoading ? <div className="text-xs text-muted-foreground">Carregando tópicos...</div> : null}

      <div className="space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5 dark:border-neutral-700"
          >
            <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                    value={editingDescricao}
                    onChange={(e) => setEditingDescricao(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                    value={editingOrdem}
                    onChange={(e) => setEditingOrdem(Number(e.target.value))}
                  />
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-foreground">{t.descricao}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Ordem: {t.numero_ordem}</div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <select
                className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                value={t.status}
                onChange={(e) => updateMutation.mutate({ topicoId: t.id, data: { status: e.target.value as Topico["status"] } })}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {editingId === t.id ? (
                <div className="flex gap-1">
                  <button
                    className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-1 text-xs text-white"
                    onClick={() => {
                      updateMutation.mutate({ topicoId: t.id, data: { descricao: editingDescricao, numero_ordem: editingOrdem } });
                      setEditingId(null);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Salvar
                  </button>
                  <button
                    className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs dark:border-neutral-600"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs dark:border-neutral-600 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setEditingId(t.id);
                      setEditingDescricao(t.descricao);
                      setEditingOrdem(t.numero_ordem);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2 py-1 text-xs text-danger-600 dark:bg-danger-950/50 dark:text-danger-400"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

