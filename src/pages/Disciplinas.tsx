import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DisciplinaCard } from "@/components/disciplinas/DisciplinaCard";
import { EditalVerticalizadoOverview } from "@/components/disciplinas/EditalVerticalizadoOverview";
import { DisciplinasDataTable } from "@/components/disciplinas/DisciplinasDataTable";
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
import { getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import type { Disciplina, FilterSeg } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { useUiStore } from "@/stores/uiStore";
import { CatalogPagination } from "@/components/editais/CatalogPagination";

type DisciplinaPage = {
  items: Disciplina[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: { total: number; em_progresso: number; no_concurso: number; fora_concurso: number; progresso_medio: number };
};

function isLinkedToConcurso(d: Disciplina, concursoId: string) {
  return d.concurso_ids.includes(concursoId);
}

export function Disciplinas() {
  const PAGE_SIZE = 9;
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
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (viewMode === "edital" && !concursoId) {
      setViewMode("cards");
    }
  }, [concursoId, setViewMode, viewMode]);

  const searchTerm = React.useDeferredValue(search.trim());

  const pageQuery = useQuery({
    queryKey: ["disciplinas", "paginated", searchTerm || null, concursoId || null, filterSeg, page],
    queryFn: async () =>
      (
        await api.get("/disciplinas/paginadas", {
          params: {
            page,
            page_size: PAGE_SIZE,
            ...(searchTerm ? { search: searchTerm } : {}),
            ...(concursoId ? { concurso_id: concursoId, vinculo: filterSeg } : {}),
          },
        })
      ).data as DisciplinaPage,
    enabled: viewMode !== "edital",
  });
  const editalQuery = useQuery({
    queryKey: ["disciplinas", "edital", concursoId || null],
    queryFn: async () => (await api.get("/disciplinas", { params: { include_topicos_stats: true, concurso_id: concursoId } })).data as Disciplina[],
    enabled: viewMode === "edital" && Boolean(concursoId),
  });
  React.useEffect(() => {
    if (pageQuery.data && pageQuery.data.total_pages > 0 && page > pageQuery.data.total_pages) {
      setPage(pageQuery.data.total_pages);
    }
  }, [page, pageQuery.data]);
  const disciplinas = viewMode === "edital" ? (editalQuery.data ?? []) : (pageQuery.data?.items ?? []);
  const loadingDisciplinas = viewMode === "edital" ? editalQuery.isLoading : pageQuery.isLoading;

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

  const summary = pageQuery.data?.summary
    ? { n: pageQuery.data.summary.total, emProg: pageQuery.data.summary.em_progresso, noConcurso: pageQuery.data.summary.no_concurso, fora: pageQuery.data.summary.fora_concurso, media: pageQuery.data.summary.progresso_medio }
    : { n: 0, emProg: 0, noConcurso: 0, fora: 0, media: 0 };

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
    <div className="min-h-full space-y-6 pb-10">
      <DisciplinasToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        filterSeg={filterSeg}
        onFilterChange={(value) => { setFilterSeg(value); setPage(1); }}
        onCreate={openCreate}
        summary={summary}
        concursoId={concursoId}
        isCreating={createMutation.isPending}
        viewMode={viewMode}
        onViewModeChange={(value) => { setViewMode(value); setPage(1); }}
      />

      {loadingDisciplinas ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          <DisciplinaCardSkeleton />
          <DisciplinaCardSkeleton />
          <DisciplinaCardSkeleton />
          <DisciplinaCardSkeleton />
          <DisciplinaCardSkeleton />
          <DisciplinaCardSkeleton />
        </div>
      ) : null}

      {!loadingDisciplinas && disciplinas.length === 0 && !searchTerm && filterSeg === "todas" && summary.n === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <EmptyDisciplinasIllustration />
          <h2 className="mt-6 text-base font-semibold text-card-foreground">Nenhuma disciplina ainda</h2>
          <p className="mt-2 max-w-[360px] text-sm text-muted-foreground">
            Crie disciplinas no catálogo e vincule aos seus concursos quando quiser.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Nova disciplina
          </button>
        </div>
      ) : null}

      {!loadingDisciplinas && disciplinas.length === 0 && (searchTerm || filterSeg !== "todas" || summary.n > 0) ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          {searchTerm ? <>Nenhuma disciplina encontrada para &ldquo;{searchTerm}&rdquo;.</> : "Nenhuma disciplina neste filtro."}
        </div>
      ) : null}

      {!loadingDisciplinas && disciplinas.length > 0 && viewMode === "table" ? (
        <DisciplinasDataTable
          disciplinas={disciplinas}
          concursoId={concursoId}
          onEdit={openEdit}
          onToggleConcurso={(d) => toggleConcursoMutation.mutate(d)}
          onConfirmDelete={async (d) => {
            await deleteDisciplinaMutation.mutateAsync(d.id);
            toast.success("Disciplina removida.");
          }}
        />
      ) : null}

      {!loadingDisciplinas && disciplinas.length > 0 && viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {disciplinas.map((disciplina, index) => {
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

      {!loadingDisciplinas && viewMode !== "edital" && pageQuery.data?.total ? (
        <CatalogPagination page={pageQuery.data.page} totalPages={pageQuery.data.total_pages} total={pageQuery.data.total} onPageChange={setPage} itemLabel="disciplina" ariaLabel="Paginação de disciplinas" />
      ) : null}

      {!loadingDisciplinas && viewMode === "edital" && concursoId ? (
        <EditalVerticalizadoOverview
          disciplinas={disciplinas.filter((disciplina) => isLinkedToConcurso(disciplina, concursoId))}
        />
      ) : null}

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
                prioridadeCalculada: editingDisciplina.prioridade_calculada ?? null,
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
