import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DisciplinaCard } from "@/components/disciplinas/DisciplinaCard";
import { DisciplinasDataTable } from "@/components/disciplinas/DisciplinasDataTable";
import { DisciplinaPesoRanking } from "@/components/disciplinas/DisciplinaPesoRanking";
import {
  DisciplinaCardSkeleton,
  EmptyDisciplinasIllustration,
} from "@/components/disciplinas/DisciplinaPageParts";
import { DisciplinasToolbar } from "@/components/disciplinas/DisciplinasToolbar";
import {
  ModalDisciplinaForm,
  toDisciplinaInput,
  type DisciplinaFormValues,
} from "@/components/disciplinas/ModalDisciplinaForm";
import { getDisciplinaStatusLabel, getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import type { Disciplina, FilterSeg } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { useUiStore } from "@/stores/uiStore";

function isLinkedToConcurso(d: Disciplina, concursoId: string) {
  return d.concurso_ids.includes(concursoId);
}

export function Disciplinas() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();
  const concursoId = concursoAtivoId ?? "";
  const viewMode = useUiStore((s) => s.disciplinasViewMode);
  const setViewMode = useUiStore((s) => s.setDisciplinasViewMode);

  const [search, setSearch] = React.useState("");
  const [filterSeg, setFilterSeg] = React.useState<FilterSeg>("todas");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingDisciplina, setEditingDisciplina] = React.useState<Disciplina | null>(null);

  const searchTerm = search.trim();

  const { data: disciplinas = [], isLoading: loadingDisciplinas } = useQuery({
    queryKey: ["disciplinas", "catalog", searchTerm || null],
    queryFn: async () =>
      (
        await api.get("/disciplinas", {
          params: {
            include_topicos_stats: true,
            ...(searchTerm ? { search: searchTerm } : {}),
          },
        })
      ).data as Disciplina[],
  });

  const createMutation = useMutation({
    mutationFn: async (values: DisciplinaFormValues) =>
      (await api.post("/disciplinas", toDisciplinaInput(values))).data as Disciplina,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DisciplinaFormValues }) =>
      (await api.put(`/disciplinas/${id}`, toDisciplinaInput(values))).data as Disciplina,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });

  const deleteDisciplinaMutation = useMutation({
    mutationFn: async (disciplinaId: string) => {
      await api.delete(`/disciplinas/${disciplinaId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });

  const toggleConcursoMutation = useMutation({
    mutationFn: async (d: Disciplina) => {
      if (!concursoId) return;
      if (isLinkedToConcurso(d, concursoId)) {
        await api.delete(`/concursos/${concursoId}/disciplinas/${d.id}`);
      } else {
        await api.post(`/concursos/${concursoId}/disciplinas`, { disciplina_id: d.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });

  const filteredDisciplinas = React.useMemo(() => {
    return disciplinas.filter((d) => {
      if (!concursoId) return true;
      const linked = isLinkedToConcurso(d, concursoId);
      if (filterSeg === "concurso") return linked;
      if (filterSeg === "fora") return !linked;
      return true;
    });
  }, [disciplinas, filterSeg, concursoId]);

  const summary = React.useMemo(() => {
    let emProg = 0;
    let noConcurso = 0;
    let fora = 0;
    let pctSum = 0;
    const n = disciplinas.length;
    for (const d of disciplinas) {
      const total = d.topicos_total ?? 0;
      const estudados = d.topicos_estudados ?? 0;
      const stats = getTopicosProgressFromCounts(total, estudados);
      const st = getDisciplinaStatusLabel(stats);
      if (st.kind === "em_progresso" || st.kind === "iniciando") emProg++;
      if (concursoId && isLinkedToConcurso(d, concursoId)) noConcurso++;
      else if (concursoId) fora++;
      pctSum += stats.pct;
    }
    return { n, emProg, noConcurso, fora, media: n > 0 ? Math.round(pctSum / n) : 0 };
  }, [disciplinas, concursoId]);

  const openCreate = () => {
    setModalMode("create");
    setEditingDisciplina(null);
    setModalOpen(true);
  };

  const openEdit = (d: Disciplina) => {
    setModalMode("edit");
    setEditingDisciplina(d);
    setModalOpen(true);
  };

  const handleSubmit = async (values: DisciplinaFormValues) => {
    if (modalMode === "create") {
      await createMutation.mutateAsync(values);
      toast.success(
        values.concursoIds.length > 0
          ? "Disciplina criada e vinculada ao(s) concurso(s)."
          : "Disciplina adicionada ao catálogo.",
      );
    } else if (editingDisciplina) {
      await updateMutation.mutateAsync({ id: editingDisciplina.id, values });
      toast.success("Disciplina atualizada.");
    }
    setModalOpen(false);
    setEditingDisciplina(null);
  };

  return (
    <div className="min-h-full pb-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="space-y-5">
        <DisciplinasToolbar
          search={search}
          onSearchChange={setSearch}
          filterSeg={filterSeg}
          onFilterChange={setFilterSeg}
          onCreate={openCreate}
          summary={summary}
          concursoId={concursoId}
          isCreating={createMutation.isPending}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {!loadingDisciplinas && disciplinas.length > 0 ? (
          <DisciplinaPesoRanking disciplinas={disciplinas} concursoId={concursoId} filterSeg={filterSeg} />
        ) : null}

        {loadingDisciplinas ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DisciplinaCardSkeleton />
            <DisciplinaCardSkeleton />
          </div>
        ) : null}

        {!loadingDisciplinas && disciplinas.length === 0 && !searchTerm ? (
          <div className="flex flex-col items-center rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <EmptyDisciplinasIllustration />
            <h2 className="mt-6 text-lg font-bold text-[var(--text-primary)]">Nenhuma disciplina ainda</h2>
            <p className="mt-2 max-w-[360px] text-sm text-[var(--text-secondary)]">
              Crie disciplinas no catálogo e vincule aos seus concursos quando quiser.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-px hover:bg-[#5B32A8]"
            >
              + Nova disciplina
            </button>
          </div>
        ) : null}

        {!loadingDisciplinas && disciplinas.length === 0 && searchTerm ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)] shadow-sm">
            Nenhuma disciplina encontrada para &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : null}

        {!loadingDisciplinas && disciplinas.length > 0 && filteredDisciplinas.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)] shadow-sm">
            {searchTerm
              ? `Nenhuma disciplina encontrada para "${searchTerm}" neste filtro.`
              : "Nenhuma disciplina neste filtro."}
          </div>
        ) : null}

        {!loadingDisciplinas && filteredDisciplinas.length > 0 && viewMode === "table" ? (
          <DisciplinasDataTable
            disciplinas={filteredDisciplinas}
            concursoId={concursoId}
            onEdit={openEdit}
            onToggleConcurso={(d) => toggleConcursoMutation.mutate(d)}
            onConfirmDelete={async (d) => {
              await deleteDisciplinaMutation.mutateAsync(d.id);
              toast.success("Disciplina removida.");
            }}
          />
        ) : null}

        {!loadingDisciplinas && filteredDisciplinas.length > 0 && viewMode === "cards" ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredDisciplinas.map((disciplina, index) => {
              const total = disciplina.topicos_total ?? 0;
              const estudados = disciplina.topicos_estudados ?? 0;
              const stats = getTopicosProgressFromCounts(total, estudados);
              const inConcurso = concursoId ? isLinkedToConcurso(disciplina, concursoId) : false;
              return (
                <DisciplinaCard
                  key={disciplina.id}
                  index={index}
                  disciplina={disciplina}
                  stats={stats}
                  inConcurso={inConcurso}
                  concursoCount={disciplina.concurso_ids.length}
                  canToggleConcurso={Boolean(concursoId)}
                  onToggleConcurso={() => toggleConcursoMutation.mutate(disciplina)}
                  onEdit={() => openEdit(disciplina)}
                  onConfirmDelete={async () => {
                    await deleteDisciplinaMutation.mutateAsync(disciplina.id);
                    toast.success("Disciplina removida.");
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <ModalDisciplinaForm
        open={modalOpen}
        mode={modalMode}
        defaultConcursoId={concursoId || undefined}
        initialValues={
          editingDisciplina
            ? {
                nome: editingDisciplina.nome,
                sigla: editingDisciplina.sigla ?? "",
                concursoIds: editingDisciplina.concurso_ids,
              }
            : undefined
        }
        computedTotals={
          editingDisciplina
            ? {
                peso: editingDisciplina.peso ?? null,
                totalPontos: editingDisciplina.total_pontos ?? null,
                topicosTotal: editingDisciplina.topicos_total ?? null,
              }
            : undefined
        }
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) return;
          setModalOpen(false);
          setEditingDisciplina(null);
        }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
