import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookCheck, RefreshCw } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { RevisaoActionDialogs, type RevisaoDialogAction } from "@/components/revisoes/RevisaoActionDialogs";
import { RevisaoCard } from "@/components/revisoes/RevisaoCard";
import { RevisoesFilters, type RevisoesFilterValues } from "@/components/revisoes/RevisoesFilters";
import { RevisoesListSkeleton } from "@/components/revisoes/RevisoesListSkeleton";
import { REVIEW_GROUPS as groups, RevisoesContest, RevisoesEmpty, RevisoesSummary } from "@/components/revisoes/RevisoesPresentation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRevisoes } from "@/hooks/useRevisoes";
import { usePomodoroConfigSync } from "@/hooks/usePomodoroConfigSync";
import { buildPomodoroRevisionLaunchUrl } from "@/lib/pomodoro/launchFromCronograma";
import { resolvePersistedFocusMinutes } from "@/lib/pomodoro/duration";
import { api } from "@/services/api";
import {
  useConcursoAtivoId,
  useConcursoContextError,
  useConcursoContextResolved,
} from "@/stores/concursoStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";
import type { RevisaoGrupo, RevisaoItem } from "@/types/revisao";

const groupSet = new Set<RevisaoGrupo>(groups.map((item) => item.value));

function readGroup(value: string | null): RevisaoGrupo {
  return value && groupSet.has(value as RevisaoGrupo) ? value as RevisaoGrupo : "hoje";
}

function readDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return isValid(parseISO(value)) ? value : "";
}

function groupByDate(items: RevisaoItem[]) {
  return items.reduce<Record<string, RevisaoItem[]>>((result, item) => {
    (result[item.data_prevista_atual] ||= []).push(item);
    return result;
  }, {});
}

function formatGroupDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "EEEE, dd 'de' MMMM", { locale: ptBR }) : value;
}

export function Revisoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const concursoId = useConcursoAtivoId();
  const contextResolved = useConcursoContextResolved();
  const contextError = useConcursoContextError();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = React.useState<{ item: RevisaoItem; action: RevisaoDialogAction } | null>(null);
  const [conflicts, setConflicts] = React.useState<Set<string>>(() => new Set());
  const revisaoPomodoroContext = useRevisaoPomodoroStore((state) => state.context);
  const revisaoPomodoroConflict = useRevisaoPomodoroStore((state) => state.conflict);
  const { query: pomodoroConfig } = usePomodoroConfigSync();
  const grupo = readGroup(searchParams.get("grupo"));
  const filters: RevisoesFilterValues = {
    disciplinaId: searchParams.get("disciplina") || "",
    dataInicio: readDate(searchParams.get("inicio")),
    dataFim: readDate(searchParams.get("fim")),
  };
  const invalidDates = Boolean(filters.dataInicio && filters.dataFim && filters.dataInicio > filters.dataFim);

  const revisoes = useRevisoes({
    concursoId,
    grupo,
    disciplinaId: filters.disciplinaId || null,
    dataInicio: filters.dataInicio || null,
    dataFim: filters.dataFim || null,
    limit: 20,
    enabled: contextResolved && !contextError && !invalidDates,
  });
  const disciplinas = useQuery({
    queryKey: ["disciplinas", "revisoes", concursoId ?? null],
    queryFn: async () => (await api.get<Array<{ id: string; nome: string }>>("/disciplinas", {
      params: { concurso_id: concursoId },
    })).data,
    enabled: contextResolved && !contextError && Boolean(concursoId),
  });
  const concursos = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get<Array<{ id: string; nome: string }>>("/concursos")).data,
    enabled: contextResolved && !contextError,
  });
  const concursoAtivo = concursos.data?.find((item) => item.id === concursoId);

  React.useEffect(() => {
    if (!revisaoPomodoroConflict || !revisaoPomodoroContext?.revisaoId) return;
    setConflicts((current) => new Set(current).add(revisaoPomodoroContext.revisaoId));
  }, [revisaoPomodoroConflict, revisaoPomodoroContext?.revisaoId]);

  const setGroup = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("grupo", readGroup(value));
    setSearchParams(next, { replace: true });
  };
  const setFilters = (values: RevisoesFilterValues) => {
    if (values.dataInicio && values.dataFim && values.dataInicio > values.dataFim) {
      toast.error("A data inicial não pode ser posterior à data final.");
      return;
    }
    const next = new URLSearchParams(searchParams);
    const pairs = [
      ["disciplina", values.disciplinaId],
      ["inicio", values.dataInicio],
      ["fim", values.dataFim],
    ] as const;
    pairs.forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearchParams(next, { replace: true });
  };
  const startReview = (item: RevisaoItem) => {
    const minutos = pomodoroConfig.data
      ? resolvePersistedFocusMinutes(pomodoroConfig.data.focus_hours, pomodoroConfig.data.focus_minutes)
      : null;
    if (!minutos) {
      toast.error("Configure uma duração do Pomodoro entre 1 e 480 minutos antes de revisar.");
      return;
    }
    const returnTo = `${location.pathname}${location.search}`;
    const context = {
      revisaoId: item.id,
      revisaoVersao: item.versao,
      concursoId: item.concurso_id,
      disciplinaId: item.disciplina_id,
      topicoId: item.topico_id,
      returnTo,
    };
    useRevisaoPomodoroStore.getState().prepare(context);
    navigate(buildPomodoroRevisionLaunchUrl({ ...context, minutos }));
  };
  const markConflict = (itemId: string) => {
    setConflicts((current) => new Set(current).add(itemId));
  };
  const refreshConflict = async (itemId: string) => {
    await revisoes.refetch();
    setConflicts((current) => {
      const next = new Set(current);
      next.delete(itemId);
      return next;
    });
    const stored = useRevisaoPomodoroStore.getState();
    if (stored.context?.revisaoId === itemId) stored.clear();
  };

  if (!contextResolved) return <RevisoesListSkeleton />;
  if (contextError) {
    return (
      <Alert variant="destructive">
        <RefreshCw aria-hidden="true" />
        <AlertTitle>Não foi possível carregar o concurso ativo</AlertTitle>
        <AlertDescription>Os dados anteriores foram ocultados. Tente novamente pelo seletor de concursos.</AlertDescription>
      </Alert>
    );
  }
  if (!concursoId) {
    return (
      <EmptyState
        icon={BookCheck}
        title="Escolha um concurso para revisar"
        description="A Central mostra somente as revisões vinculadas ao concurso ativo."
        action={<Button asChild><Link to="/concursos">Ver meus concursos</Link></Button>}
      />
    );
  }

  const items = revisoes.data?.pages.flatMap((page) => page.items) ?? [];
  const datedGroups = groupByDate(items);
  const hasFilters = Boolean(filters.disciplinaId || filters.dataInicio || filters.dataFim);

  return (
    <div className="reviews-page w-full min-w-0 space-y-5 pb-8">
      <header className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight text-foreground">Central de Revisões</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Organize suas revisões, priorize conteúdos pendentes e acompanhe sua evolução.
        </p>
        </div>
        {concursoAtivo && <RevisoesContest nome={concursoAtivo.nome} />}
      </header>

      <div className="space-y-3">
      <RevisoesSummary resumo={revisoes.isError || invalidDates ? null : revisoes.data?.pages[0]?.resumo} loading={revisoes.isPending && !invalidDates} />

      <Tabs value={grupo} onValueChange={setGroup}>
        <div className="min-w-0 overflow-x-auto rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="min-h-11 w-max min-w-full justify-start" aria-label="Grupos de revisão">
            {groups.map((item) => (
              <TabsTrigger key={item.value} value={item.value} data-group={item.value} className="review-tab min-h-11 min-w-max gap-1.5 px-3">
                <item.Icon className="size-3.5" aria-hidden />{item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      </div>

      <RevisoesFilters
        values={filters}
        disciplinas={disciplinas.data ?? []}
        onChange={setFilters}
      />

      {invalidDates && <Alert variant="destructive"><AlertTitle>Período inválido</AlertTitle><AlertDescription>A data inicial não pode ser posterior à data final. Ajuste ou limpe os filtros.</AlertDescription></Alert>}
      {revisoes.isPending && !invalidDates ? <RevisoesListSkeleton /> : null}
      {revisoes.isError && !invalidDates ? (
        <Alert variant="destructive">
          <RefreshCw aria-hidden="true" />
          <AlertTitle>Não foi possível carregar as revisões</AlertTitle>
          <AlertDescription>
            O conteúdo anterior não foi reaproveitado.
            <Button type="button" variant="outline" size="sm" className="mt-3 block" onClick={() => void revisoes.refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {revisoes.isSuccess && !invalidDates && items.length === 0 ? (
        <RevisoesEmpty grupo={grupo} filtered={hasFilters} resumo={revisoes.data?.pages[0]?.resumo} onClear={() => setFilters({ disciplinaId: "", dataInicio: "", dataFim: "" })} onNext={() => setGroup("proximas")} />
      ) : null}
      {revisoes.isSuccess && !invalidDates && items.length > 0 ? (
        <div className="space-y-6" aria-live="polite">
          {Object.entries(datedGroups).map(([date, dateItems]) => (
            <section key={date} aria-labelledby={`revisoes-${date}`} className="space-y-3">
              <h2 id={`revisoes-${date}`} className="text-sm font-semibold capitalize text-foreground">
                {formatGroupDate(date)}
              </h2>
              <div className="grid gap-3 xl:grid-cols-2">
                {dateItems.map((item) => (
                  <RevisaoCard
                    key={item.id}
                    item={item}
                    grupo={grupo}
                    conflict={conflicts.has(item.id)}
                    onStart={startReview}
                    onAction={(selected, action) => setDialog({ item: selected, action })}
                    onRefreshConflict={(itemId) => void refreshConflict(itemId)}
                  />
                ))}
              </div>
            </section>
          ))}
          <div className="flex flex-col items-center gap-2">
            {revisoes.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                disabled={revisoes.isFetchingNextPage}
                onClick={() => void revisoes.fetchNextPage()}
              >
                {revisoes.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            ) : <p className="text-xs text-muted-foreground">Você chegou ao fim da lista.</p>}
          </div>
        </div>
      ) : null}

      <RevisaoActionDialogs
        item={dialog?.item ?? null}
        action={dialog?.action ?? null}
        onClose={() => setDialog(null)}
        onConflict={markConflict}
      />
    </div>
  );
}
