import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { DisciplinaCard } from "@/components/disciplinas/DisciplinaCard";
import { getDisciplinaStatusLabel, getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
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

type FilterSeg = "todas" | "plano" | "fora";

function DisciplinaCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="h-[3px] bg-[var(--border-default)]" />
      <div className="flex gap-3 px-5 pt-[18px]">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--bg-surface-2)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-20 rounded-full bg-[var(--bg-surface-2)]" />
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex justify-between">
          <div className="h-3 w-40 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-8 rounded bg-[var(--bg-surface-2)]" />
        </div>
        <div className="h-2 rounded-full bg-[var(--border-default)]" />
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-3">
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
      </div>
      <div className="border-t border-[var(--border-subtle)] px-5 py-3">
        <div className="h-6 w-24 rounded-full bg-[var(--bg-surface-2)]" />
      </div>
    </div>
  );
}

function EmptyDisciplinasIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden className="text-[#6C3FC5]">
      <rect x="24" y="58" width="72" height="28" rx="4" fill="currentColor" fillOpacity="0.12" />
      <rect x="32" y="42" width="56" height="22" rx="4" fill="currentColor" fillOpacity="0.18" />
      <rect x="40" y="26" width="40" height="22" rx="4" fill="currentColor" fillOpacity="0.28" />
      <path d="M52 32h16M52 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
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
  const [editingDisciplina, setEditingDisciplina] = React.useState<Disciplina | null>(null);
  const [editingDisciplinaNome, setEditingDisciplinaNome] = React.useState("");
  const [filterSeg, setFilterSeg] = React.useState<FilterSeg>("todas");
  const addInputRef = React.useRef<HTMLInputElement>(null);

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

  const filteredDisciplinas = React.useMemo(() => {
    return disciplinas.filter((d) => {
      const inP = Boolean(planoDisciplinaMap[d.id]);
      if (filterSeg === "plano") return inP;
      if (filterSeg === "fora") return !inP;
      return true;
    });
  }, [disciplinas, filterSeg, planoDisciplinaMap]);

  const summary = React.useMemo(() => {
    let emProg = 0;
    let noPlano = 0;
    let fora = 0;
    let pctSum = 0;
    const n = disciplinas.length;
    for (const d of disciplinas) {
      const total = d.topicos_total ?? 0;
      const estudados = d.topicos_estudados ?? 0;
      const stats = getTopicosProgressFromCounts(total, estudados);
      const st = getDisciplinaStatusLabel(stats);
      if (st.kind === "em_progresso" || st.kind === "iniciando") emProg++;
      if (planoDisciplinaMap[d.id]) noPlano++;
      else fora++;
      pctSum += stats.pct;
    }
    const media = n > 0 ? Math.round(pctSum / n) : 0;
    return { n, emProg, noPlano, fora, media };
  }, [disciplinas, planoDisciplinaMap]);

  const focusAddInput = () => {
    addInputRef.current?.focus();
  };

  const addDisciplina = () => {
    const nome = newDisciplinaNome.trim();
    if (!nome || !concursoId) return;
    createDisciplinaMutation.mutate(
      {
        concurso_id: concursoId,
        nome,
        sigla: null,
        total_questoes_prova: null,
        peso: null,
        prioridade: null,
        cor_hex: null,
        ordem: 0,
      },
      {
        onSuccess: () => {
          setNewDisciplinaNome("");
          toast.success("✅ Disciplina adicionada!", { duration: 3000 });
        },
      },
    );
  };

  return (
    <div className="min-h-full pb-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="space-y-5">
        {/* Linha 1 — título + filtro + CTA */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-[var(--text-primary)]">Disciplinas & Tópicos</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Gerencie as disciplinas do seu plano de estudo</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex rounded-full bg-[#F3F4F6] p-1 dark:bg-[var(--bg-surface-2)]">
              {(
                [
                  { id: "todas" as const, label: "Todas" },
                  { id: "plano" as const, label: "No plano" },
                  { id: "fora" as const, label: "Fora do plano" },
                ] as const
              ).map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setFilterSeg(seg.id)}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200",
                    filterSeg === seg.id
                      ? "bg-[#6C3FC5] text-white shadow-sm"
                      : "bg-transparent text-[#6B7280] hover:text-[#1A1A2E] dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]",
                  )}
                >
                  {seg.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={focusAddInput}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8] hover:shadow-md"
            >
              <span className="text-lg leading-none">+</span>
              Nova disciplina
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
            📚 {summary.n} {summary.n === 1 ? "disciplina" : "disciplinas"}
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
            ✅ {summary.emProg} em progresso
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
            📋 {summary.noPlano} no plano · {summary.fora} fora do plano
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
            📈 {summary.media}% de progresso médio
          </span>
        </div>

        {!concursoId ? (
          <div className="rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-sm text-amber-900">
            Selecione um concurso ativo na sessão para listar e criar disciplinas.
          </div>
        ) : null}

        {/* Barra adicionar */}
        <div
          className="flex items-center gap-3 rounded-xl border-[1.5px] border-[var(--border-default)] bg-white py-1 pl-4 pr-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:bg-[var(--bg-surface)]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          <span className="shrink-0 text-base text-[var(--text-muted)]" aria-hidden>
            🔍
          </span>
          <input
            ref={addInputRef}
            className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Adicionar nova disciplina (ex: Direito Tributário)..."
            value={newDisciplinaNome}
            onChange={(e) => setNewDisciplinaNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDisciplina()}
            disabled={!concursoId || createDisciplinaMutation.isPending}
          />
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-lg bg-[#6C3FC5] px-[18px] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B32A8]",
              (!newDisciplinaNome.trim() || !concursoId || createDisciplinaMutation.isPending) &&
                "cursor-not-allowed opacity-45 hover:bg-[#6C3FC5]",
            )}
            disabled={!concursoId || !newDisciplinaNome.trim() || createDisciplinaMutation.isPending}
            onClick={addDisciplina}
          >
            + Adicionar
          </button>
        </div>

        {/* Grid */}
        {loadingDisciplinas && concursoId ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DisciplinaCardSkeleton />
            <DisciplinaCardSkeleton />
          </div>
        ) : null}

        {!loadingDisciplinas && concursoId && disciplinas.length === 0 ? (
          <div
            className="flex flex-col items-center rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <EmptyDisciplinasIllustration />
            <h2 className="mt-6 text-lg font-bold text-[var(--text-primary)]">Nenhuma disciplina ainda</h2>
            <p className="mt-2 max-w-[360px] text-sm text-[var(--text-secondary)]">
              Adicione sua primeira disciplina para começar a organizar seus estudos.
            </p>
            <button
              type="button"
              onClick={focusAddInput}
              className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-px hover:bg-[#5B32A8]"
            >
              + Adicionar primeira disciplina
            </button>
          </div>
        ) : null}

        {!loadingDisciplinas && concursoId && disciplinas.length > 0 && filteredDisciplinas.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)] shadow-sm">
            Nenhuma disciplina neste filtro.
          </div>
        ) : null}

        {!loadingDisciplinas && filteredDisciplinas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredDisciplinas.map((disciplina) => {
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
                  planoAtivoId={planoAtivo?.id ?? null}
                  onTogglePlano={() => togglePlanoMutation.mutate(disciplina)}
                  onEdit={() => {
                    setEditingDisciplina(disciplina);
                    setEditingDisciplinaNome(disciplina.nome);
                  }}
                  onConfirmDelete={async () => {
                    await deleteDisciplinaMutation.mutateAsync(disciplina.id);
                    toast.success("🗑️ Disciplina removida.", { duration: 5000 });
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {editingDisciplina ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingDisciplina(null);
          }}
        >
          <div className="w-full max-w-md rounded-xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#6C3FC5] dark:bg-[var(--ap-brand-light)] dark:text-[var(--ap-brand)]">
                <Pencil className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Editar disciplina</h3>
            </div>
            <input
              className="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE] dark:bg-[var(--bg-surface-2)] dark:focus:shadow-[0_0_0_3px_rgba(167,139,250,0.2)]"
              value={editingDisciplinaNome}
              onChange={(e) => setEditingDisciplinaNome(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[#F9FAFB] dark:hover:bg-[var(--bg-surface-hover)]"
                onClick={() => setEditingDisciplina(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-[10px] bg-[#6C3FC5] px-4 py-2 text-sm font-bold text-white hover:bg-[#5B32A8] disabled:opacity-50"
                disabled={!editingDisciplinaNome.trim() || updateDisciplinaMutation.isPending}
                onClick={async () => {
                  await updateDisciplinaMutation.mutateAsync({
                    disciplinaId: editingDisciplina.id,
                    nome: editingDisciplinaNome.trim(),
                  });
                  setEditingDisciplina(null);
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
