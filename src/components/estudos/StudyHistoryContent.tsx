import { useEffect, useMemo, useState } from "react";
import { ArrowDown, BookOpen, CalendarCheck, CircleCheck, Clock, History, Layers, LoaderCircle, Search } from "lucide-react";

import { StudyHistoryFilters, type HistoryFilterValues } from "@/components/estudos/StudyHistoryFilters";
import { formatStudyTime, groupStudyHistory, StudyHistoryList } from "@/components/estudos/StudyHistoryList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, type MetricTone } from "@/components/ui/metric-card";
import { useStudyHistory } from "@/hooks/useStudyHistory";
import type { StudyHistoryOrder, StudyHistorySummary } from "@/lib/historico/types";

type Scope = { concursoId: string; disciplinaId: string; planoId?: string };

const lastStudyFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const amountFormat = new Intl.NumberFormat("pt-BR");

export default function StudyHistoryContent({ concursoId, disciplinaId, planoId }: Scope) {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<HistoryFilterValues>({});
  const [order, setOrder] = useState<StudyHistoryOrder>("recentes");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(text.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [text]);

  const { history, summary } = useStudyHistory({
    concurso_id: concursoId, disciplina_id: disciplinaId, plano_id: planoId,
    ...filters, busca: search || undefined,
  }, order);
  const { days, count } = useMemo(() => groupStudyHistory(history.data?.pages), [history.data?.pages]);
  const hasFilters = Boolean(text.trim() || search || Object.values(filters).some(Boolean) || order === "antigos");
  const clearSearch = () => { setText(""); setSearch(""); };
  const clear = () => { clearSearch(); setFilters({}); setOrder("recentes"); };
  const searching = text.trim() !== search || Boolean(search && history.isFetching && !history.isFetchingNextPage);
  const orderLabel = order === "recentes" ? "Mais recentes primeiro" : "Mais antigos primeiro";
  const EmptyIcon = hasFilters ? Search : History;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6"
      tabIndex={0} role="region" aria-label="Registros da disciplina">
      {summary.data ? <HistorySummary summary={summary.data} /> : summary.isError ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <p role="alert">Resumo indisponível.</p>
          <Button variant="outline" size="sm" onClick={() => void summary.refetch()}>Recarregar resumo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="status" aria-label="Carregando resumo">
          {["sessions", "time", "topics", "last"].map((key) => <Skeleton key={key} className="h-24 rounded-xl" />)}
        </div>
      )}
      <StudyHistoryFilters text={text} onTextChange={setText} filters={filters}
        onChange={(patch) => setFilters((previous) => ({ ...previous, ...patch }))}
        order={order} onOrderChange={setOrder} disciplinaId={disciplinaId} onClear={clear} onClearSearch={clearSearch} searching={searching} />
      {history.isPending ? (
        <div className="space-y-2 border-l border-border pl-3" role="status">
          <span className="sr-only">Carregando histórico de estudo</span>
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : history.isError && !history.data ? (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar o histórico.</p>
          <Button size="sm" variant="outline" onClick={() => void history.refetch()}>Tentar novamente</Button>
        </div>
      ) : count > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">Sessões de estudo</h3>
            <p className="text-xs tabular-nums text-muted-foreground" role="status">
              {amountFormat.format(count)}
              {summary.data && ` de ${amountFormat.format(summary.data.total_sessoes)}`}
              {count === 1 && (summary.data?.total_sessoes ?? 1) === 1 ? " registro exibido" : " registros exibidos"}
              {" · "}{orderLabel}
            </p>
          </div>
          {history.isRefetchError && !history.isFetchNextPageError && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <p role="alert">Não foi possível atualizar as sessões.</p>
              <Button size="sm" variant="outline" onClick={() => void history.refetch()}>Tentar novamente</Button>
            </div>
          )}
          <StudyHistoryList key={JSON.stringify([filters, search, order])} days={days}
            latestId={summary.data?.ultimo_id} timezone={history.data?.pages[0]?.timezone} newestFirst={order === "recentes"} />
          {history.hasNextPage ? (
            <div className="grid justify-items-center gap-2 border-t border-border pt-3 [overflow-anchor:none]">
              {history.isFetchNextPageError && <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar mais registros.</p>}
              <Button size="sm" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={history.isFetching}
                aria-busy={history.isFetchingNextPage} onClick={() => void history.fetchNextPage({ cancelRefetch: false })}>
                {history.isFetchingNextPage ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden /> : <ArrowDown aria-hidden />}
                {history.isFetchingNextPage ? "Carregando…" : "Carregar mais registros"}
              </Button>
            </div>
          ) : <p className="flex items-center justify-center gap-1.5 border-t border-border py-3 text-xs text-muted-foreground"><CircleCheck className="size-4 shrink-0 text-success-text" aria-hidden /> Todos os registros foram exibidos.</p>}
        </div>
      ) : (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
          <EmptyIcon className="size-6 text-primary" aria-hidden />
          <p className="text-sm font-semibold">{hasFilters ? "Nenhum registro encontrado" : "Nenhum estudo registrado"}</p>
          {hasFilters
            ? <Button type="button" variant="outline" size="sm" onClick={clear}>Limpar filtros</Button>
            : <p className="text-sm text-muted-foreground">Suas sessões desta disciplina aparecerão aqui após o registro.</p>}
        </div>
      )}
    </div>
  );
}

function HistorySummary({ summary }: { summary: StudyHistorySummary }) {
  const lastDay = summary.ultimo_estudo;
  const metrics = [
    { label: "Sessões realizadas", value: amountFormat.format(summary.total_sessoes), tone: "indigo", icon: BookOpen },
    { label: "Tempo estudado", value: formatStudyTime(summary.total_segundos), tone: "green", icon: Clock },
    { label: "Tópicos distintos", value: amountFormat.format(summary.topicos_distintos), tone: "purple", icon: Layers },
    { label: "Último estudo", value: lastDay ? <time dateTime={lastDay}>{lastStudyFormat.format(new Date(`${lastDay}T12:00:00Z`))}</time> : "—", tone: "blue", icon: CalendarCheck },
  ] satisfies { label: string; value: React.ReactNode; tone: MetricTone; icon: typeof Clock }[];
  return (
    <section className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumo do histórico">
      {metrics.map((metric) => <MetricCard key={metric.label} {...metric}
        className="shadow-none sm:p-3 [&>div]:mb-1.5 [&>div]:gap-1.5 [&>div>span]:size-7 [&>div>span>svg]:size-4 [&>p]:mt-auto [&>p]:text-xl [&>p]:text-[color:var(--study-ink)]" />)}
    </section>
  );
}
