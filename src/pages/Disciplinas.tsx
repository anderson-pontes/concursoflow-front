import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DisciplinaCard } from "@/components/disciplinas/DisciplinaCard";
import { EditalVerticalizadoOverview } from "@/components/disciplinas/EditalVerticalizadoOverview";
import { DisciplinasDataTable } from "@/components/disciplinas/DisciplinasDataTable";
import {
  DisciplinaCardSkeleton,
  EmptyDisciplinasIllustration,
} from "@/components/disciplinas/DisciplinaPageParts";
import { DisciplinasToolbar } from "@/components/disciplinas/DisciplinasToolbar";
import { getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import type { Disciplina } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import {
  useConcursoAtivoId,
  useConcursoContextError,
  useConcursoContextResolved,
} from "@/stores/concursoStore";
import { useDisciplinasView } from "@/hooks/useDisciplinasView";
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
  summary: { total: number; em_progresso: number; no_concurso: number; fora_concurso: number; progresso_medio: number; topicos_total?: number; topicos_concluidos?: number };
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
  const [pageParams, setPageParams] = useSearchParams();
  const navigate = useNavigate();
  const [savedViewMode, setViewMode] = useDisciplinasView();
  const viewMode = pageParams.get("view") === "edital" ? "edital" : savedViewMode;
  const allContests = pageParams.get("escopo") === "todos";
  const search = pageParams.get("busca") ?? "";
  const requestedPage = Number(pageParams.get("pagina"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const updateFilter = React.useCallback((name: string, value: string) => {
    const next = new URLSearchParams(pageParams);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "pagina") next.delete("pagina");
    setPageParams(next, { replace: true });
  }, [pageParams, setPageParams]);
  const setPage = React.useCallback((value: number) => updateFilter("pagina", value > 1 ? String(value) : ""), [updateFilter]);
  const queryConcursoId = allContests ? null : concursoAtivoId;
  const returnSearch = pageParams.toString();

  const searchTerm = React.useDeferredValue(search.trim().slice(0, 150));

  const pageQuery = useQuery({
    queryKey: ["disciplinas", "paginated", searchTerm || null, queryConcursoId, allContests, page],
    queryFn: async ({ signal }) =>
      (
        await api.get("/disciplinas/paginadas", {
          signal,
          params: {
            page,
            page_size: PAGE_SIZE,
            ...(searchTerm ? { search: searchTerm } : {}),
            ...(queryConcursoId ? { concurso_id: queryConcursoId, vinculo: "concurso" } : {}),
          },
        })
      ).data as DisciplinaPage,
    enabled: contextResolved && !contextError && (allContests || Boolean(concursoId)) && viewMode !== "edital",
    // Keep the controls mounted while searching/paging within this contest.
    // Never retain data from a different active contest.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[3] === queryConcursoId && previousQuery?.queryKey[4] === allContests ? previous : undefined,
  });
  React.useEffect(() => {
    if (!pageQuery.isPlaceholderData && pageQuery.data && pageQuery.data.total_pages > 0 && page > pageQuery.data.total_pages) {
      setPage(pageQuery.data.total_pages);
    }
  }, [page, pageQuery.data, pageQuery.isPlaceholderData, setPage]);
  const disciplinas = pageQuery.data?.items ?? [];
  const loadingDisciplinas = viewMode === "edital" ? false : pageQuery.isLoading;

  const deleteDisciplinaMutation = useMutation({
    mutationFn: async (disciplinaId: string) => {
      await api.delete(`/disciplinas/${disciplinaId}`);
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["disciplinas"] }), qc.invalidateQueries({ queryKey: ["edital-verticalizado"] })]),
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
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["disciplinas"] }), qc.invalidateQueries({ queryKey: ["edital-verticalizado"] })]),
  });

  const summary = pageQuery.data?.summary
    ? { n: pageQuery.data.summary.total, emProg: pageQuery.data.summary.em_progresso, noConcurso: pageQuery.data.summary.no_concurso, fora: pageQuery.data.summary.fora_concurso, media: pageQuery.data.summary.progresso_medio, topicosTotal:pageQuery.data.summary.topicos_total, topicosConcluidos:pageQuery.data.summary.topicos_concluidos }
    : { n: 0, emProg: 0, noConcurso: 0, fora: 0, media: 0 };

  const openCreate = () => navigate({ pathname: "/disciplinas/nova", search: returnSearch });
  const openEdit = (d: Disciplina) => navigate({ pathname: `/disciplinas/${d.id}/editar`, search: returnSearch });

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

  if (contextStatus === "no_contest" && (!allContests || viewMode === "edital")) {
    return <div className="space-y-6 pb-10"><header><h1 className="text-2xl font-semibold tracking-tight text-foreground">{viewMode === "edital" ? "Edital Verticalizado" : "Disciplinas & Tópicos"}</h1><p className="text-sm text-muted-foreground">Escolha um concurso para organizar o conteúdo correto.</p></header><BannerSemConcurso />{viewMode !== "edital" && <Button variant="outline" onClick={() => updateFilter("escopo", "todos")}>Todos os concursos</Button>}</div>;
  }

  if (contextStatus === "error" || contextError || essentialError) {
    const retry = pageQuery.refetch;
    return <div className="space-y-6 pb-10"><header><h1 className="text-2xl font-semibold tracking-tight text-foreground">{viewMode === "edital" ? "Edital Verticalizado" : "Disciplinas & Tópicos"}</h1></header><div role="alert" className="rounded-xl border border-destructive/30 bg-card p-8 text-center"><h2 className="font-semibold">Não foi possível carregar o conteúdo</h2><p className="mt-1 text-sm text-muted-foreground">O conteúdo anterior foi ocultado. Tente novamente.</p><Button className="mt-5" onClick={() => void Promise.all([qc.invalidateQueries({ queryKey: ["concursos"] }), retry()])}>Tentar novamente</Button></div></div>;
  }

  return (
    <div className="min-h-full min-w-0 space-y-6 pb-10">
      {viewMode !== "edital" ? <DisciplinasToolbar
        updating={pageQuery.isFetching}
        search={search}
        onSearchChange={(value) => updateFilter("busca", value)}
        onAllContestsChange={(all) => updateFilter("escopo", all ? "todos" : "")}
        allContests={allContests}
        onCreate={openCreate}
        summary={summary}
        concursoId={concursoId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      /> : null}

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

      {viewMode !== "edital" && !loadingDisciplinas && disciplinas.length === 0 && !searchTerm && summary.n === 0 ? (
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

      {viewMode !== "edital" && !loadingDisciplinas && disciplinas.length === 0 && (searchTerm || summary.n > 0) ? (
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

      {!loadingDisciplinas && disciplinas.length > 0 && (viewMode === "cards" || viewMode === "list") ? (
        <div className={viewMode === "list" ? "space-y-3" : "grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3"}>
          {disciplinas.map((disciplina, index) => {
            const total = disciplina.topicos_total ?? 0;
            const estudados = disciplina.topicos_estudados ?? 0;
            const stats = getTopicosProgressFromCounts(total, estudados);
            const inConcurso = concursoId ? isLinkedToConcurso(disciplina, concursoId) : false;
            return (
              <DisciplinaCard
                key={disciplina.id}
                index={index}
                compact={viewMode === "list"}
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

    </div>
  );
}
