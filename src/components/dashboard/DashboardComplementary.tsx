import { Bell, BellOff, CalendarDays, Flame, Layers } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  DashboardSummaryCard, DashboardSummaryEmpty, DashboardSummaryError, DashboardSummaryLoading,
} from "@/components/dashboard/DashboardSummaryCard";
import { Progress } from "@/components/ui/progress";
import { dashboardDayISO, formatDashboardDuration, percentBR } from "@/lib/dashboard/analysis";
import { formatNumericDate } from "@/lib/dashboard/dates";
import { studyProgress } from "@/lib/dashboard/studyProgress";
import type { DashboardNotice, DashboardSummary } from "@/hooks/useDashboardAnalysis";

type CardQuery<T> = Pick<UseQueryResult<T>, "data" | "isError" | "isLoading" | "refetch">;

function MonthlyProgress({ data }: { data: DashboardSummary }) {
  const planned = data.minutos_planejados_mes;
  const studied = data.minutos_realizados_mes;
  const { fill, excess } = studyProgress(planned, studied);
  const achieved = planned > 0 && studied >= planned;
  return <div className="dashboard-summary-panel flex flex-1 flex-col justify-center gap-2 rounded-xl px-3 py-2.5">
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
      <p className="text-xs font-semibold">Meta mensal</p>
      <p className={`text-sm font-semibold tabular-nums ${achieved ? "text-success-text" : "text-[color:var(--soft-ink)]"}`}>
        {planned > 0 ? percentBR(data.taxa_cumprimento_mes) : "Sem planejamento mensal"}
      </p>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
      <strong className="text-sm font-semibold tabular-nums text-foreground">{formatDashboardDuration(studied)}</strong> estudados
      {planned > 0 && <> de {formatDashboardDuration(planned)} planejados</>}
    </p>
    {planned > 0 && <Progress value={fill} aria-label="Cumprimento da meta mensal de estudo"
      aria-valuetext={percentBR(data.taxa_cumprimento_mes)} className="dashboard-summary-progress h-1.5" data-achieved={achieved || undefined} />}
    {excess !== null && excess > 0 && <p className="text-xs font-semibold text-success-text">
      Meta superada em {formatDashboardDuration(excess)}
    </p>}
  </div>;
}

function FlashcardsConsistencyCard({ summary }: { summary: CardQuery<DashboardSummary> }) {
  const data = summary.data;
  return <DashboardSummaryCard title="Flashcards e constância" description="Revisão e acompanhamento do mês atual"
    icon={Layers} tone="violet" action={{ label: "Revisar flashcards", to: "/flashcards" }}>
    {summary.isLoading ? <DashboardSummaryLoading />
      : summary.isError || !data ? <DashboardSummaryError message="Indicadores indisponíveis." onRetry={() => void summary.refetch()} />
      : <div className="flex flex-1 flex-col gap-2.5">
        <dl className="grid grid-cols-2 gap-2">
          <div className="dashboard-summary-panel grid min-w-0 content-start gap-1 rounded-xl px-2.5 py-2">
            <dt className="row-start-2 text-xs leading-snug text-muted-foreground">Flashcards para revisar</dt>
            <dd className="row-start-1 flex flex-wrap items-center gap-1.5">
              <Layers className="size-4 shrink-0 text-[color:var(--soft-ink)]" aria-hidden />
              <span className="min-w-0 text-[1.625rem] font-bold leading-none tabular-nums [overflow-wrap:anywhere]">{data.flashcards_para_revisar.toLocaleString("pt-BR")}</span>
            </dd>
          </div>
          <div className="dashboard-summary-panel grid min-w-0 content-start gap-1 rounded-xl px-2.5 py-2">
            <dt className="row-start-2 text-xs leading-snug text-muted-foreground">{data.streak_dias === 1 ? "Dia" : "Dias"} de sequência</dt>
            <dd className="row-start-1 flex flex-wrap items-center gap-1.5">
              <Flame className="size-4 shrink-0 text-[color:var(--study-amber-ink)]" aria-hidden />
              <span className="min-w-0 text-[1.625rem] font-bold leading-none tabular-nums [overflow-wrap:anywhere]">{data.streak_dias.toLocaleString("pt-BR")}</span>
            </dd>
          </div>
        </dl>
        <MonthlyProgress data={data} />
      </div>}
  </DashboardSummaryCard>;
}

function ActiveNoticesCard({ notices }: { notices: CardQuery<DashboardNotice[]> }) {
  const items = notices.data ?? [];
  const today = dashboardDayISO();
  let upcoming: DashboardNotice | undefined;
  for (const notice of items) {
    const eventDate = notice.data_vencimento;
    if (eventDate && eventDate >= today && (!upcoming?.data_vencimento || eventDate < upcoming.data_vencimento)) {
      upcoming = notice;
    }
  }
  const preview = upcoming ? [upcoming, ...items.filter(item => item.id !== upcoming.id).slice(0, 3)] : items.slice(0, 4);

  return <DashboardSummaryCard title="Avisos ativos" description="Lembretes dentro do período de exibição" icon={Bell} tone="amber"
    count={notices.isError || notices.isLoading ? undefined : items.length} action={{ label: "Ver avisos ativos", to: "/avisos?status=ativo" }}>
    {notices.isError ? <DashboardSummaryError message="Avisos indisponíveis." onRetry={() => void notices.refetch()} />
      : notices.isLoading ? <DashboardSummaryLoading />
      : items.length === 0 ? <DashboardSummaryEmpty icon={BellOff} title="Nenhum aviso ativo"
        description="Os lembretes aparecem aqui durante o período de exibição." />
      : <ul aria-label="Resumo dos avisos ativos" className="space-y-1.5">
        {preview.map(item => <li key={item.id} className="dashboard-summary-panel flex min-w-0 items-start gap-2 rounded-lg px-2.5 py-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-[color:var(--soft-ink)]" aria-hidden />
          <div className="min-w-0">
            {item.id === upcoming?.id && <p className="mb-0.5 text-xs font-semibold text-[color:var(--soft-ink)]">Próximo evento</p>}
            <p className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{item.titulo}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.data_vencimento ? `Evento em ${formatNumericDate(item.data_vencimento)}` : `Exibição até ${formatNumericDate(item.data_fim)}`}
            </p>
          </div>
        </li>)}
      </ul>}
  </DashboardSummaryCard>;
}

export function DashboardComplementary({ summary, notices }: {
  summary: CardQuery<DashboardSummary>;
  notices: CardQuery<DashboardNotice[]>;
}) {
  return <>
    <FlashcardsConsistencyCard summary={summary} />
    <ActiveNoticesCard notices={notices} />
  </>;
}
