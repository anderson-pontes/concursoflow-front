import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
import {
  useConcursoAtivoId,
  useConcursoContextError,
  useConcursoContextResolved,
} from "@/stores/concursoStore";
import { useUiStore } from "@/stores/uiStore";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { resolveConcursoContextStatus } from "@/lib/concursos/context";

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
  const contextResolved = useConcursoContextResolved();
  const contextError = useConcursoContextError();
  const concursoId = concursoAtivoId ?? "";
  const viewMode = useUiStore((s) => s.disciplinasViewMode);
  const setViewMode = useUiStore((s) => s.setDisciplinasViewMode);
  const [pageParams, setPageParams] = useSearchParams();

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

  React.useEffect(() => {
    if (pageParams.get("view") === "edital" && concursoId && viewMode !== "edital") setViewMode("edital");
  }, [concursoId, pageParams, setViewMode, viewMode]);

  const changeViewMode = (value: "cards" | "table" | "edital") => {
    setViewMode(value);
    setPage(1);
    const next = new URLSearchParams(pageParams);
    if (value === "edital") next.set("view", "edital"); else next.delete("view");
    setPageParams(next);
  };

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
    enabled: contextResolved && Boolean(concursoId) && viewMode !== "edital",
  });
  React.useEffect(() => {
    if (pageQuery.data && pageQuery.data.total_pages > 0 && page > pageQuery.data.total_pages) {
      setPage(pageQuery.data.total_pages);
    }
  }, [page, pageQuery.data]);
  const disciplinas = pageQuery.data?.items ?? [];
  const loadingDisciplinas = viewMode === "edital" ? false : pageQuery.isLoading;

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

  const selectedQueryLoading = viewMode === "edital" ? false : pageQuery.isLoading;
  const essentialError = viewMode === "edital" ? false : pageQuery.isError;
  const contextStatus = resolveConcursoContextStatus({
    resolved: contextResolved,
    concursoId: concursoAtivoId,
    essentialError: contextError || essentialError,
    essentialLoading: selectedQueryLoading,
    disciplinesLoaded: !selectedQueryLoading,
    disciplinesCount: viewMode === "edital" ? 1 : summary.n,
  });

  if (contextStatus === "hydrating") return <PageSkeleton cards={3} rows={2} />;

  if (contextStatus === "no_contest") {
    return <div className="space-y-6 pb-10"><header><h1 className="text-xl font-semibold tracking-tight text-foreground">Disciplinas &amp; Tópicos</h1><p className="text-sm text-muted-foreground">Escolha um concurso para organizar o conteúdo correto.</p></header><BannerSemConcurso /></div>;
  }

  if (contextStatus === "error") {
    const retry = pageQuery.refetch;
    return <div className="space-y-6 pb-10"><header><h1 className="text-xl font-semibold tracking-tight text-foreground">Disciplinas &amp; Tópicos</h1></header><div role="alert" className="rounded-xl border border-destructive/30 bg-card p-8 text-center"><h2 className="font-semibold">Não foi possível carregar as disciplinas</h2><p className="mt-1 text-sm text-muted-foreground">O conteúdo anterior foi ocultado. Tente novamente.</p><Button className="mt-5" onClick={() => void Promise.all([qc.invalidateQueries({ queryKey: ["concursos"] }), retry()])}>Tentar novamente</Button></div></div>;
  }

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
        onViewModeChange={changeViewMode}
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

      {viewMode !== "edital" && !loadingDisciplinas && disciplinas.length === 0 && !searchTerm && filterSeg === "todas" && summary.n === 0 ? (
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

      {viewMode !== "edital" && !loadingDisciplinas && disciplinas.length === 0 && (searchTerm || filterSeg !== "todas" || summary.n > 0) ? (
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

      {viewMode === "edital" && concursoId ? (
        <EditalVerticalizadoOverview key={concursoId} concursoId={concursoId} />
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
