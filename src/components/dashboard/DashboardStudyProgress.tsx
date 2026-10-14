import type {CSSProperties} from 'react';
import {CardContent, CardDescription, CardTitle} from '@/components/ui/card';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {DashboardCard, DashboardCardHeader, DashboardEmptyPlot} from '@/components/dashboard/DashboardCard';
import {formatDashboardDuration, type AnalysisDay} from '@/lib/dashboard/analysis';
import {formatNumericDate} from '@/lib/dashboard/dates';
import {formatStudyPercent, periodStudyProgress, studyProgress} from '@/lib/dashboard/studyProgress';
import './DashboardStudyProgress.css';

function dayDescription(day: AnalysisDay) {
  const progress = studyProgress(day.minutos_planejados, day.minutos_estudados);
  const difference = progress.excess ? `Tempo excedente: ${formatDashboardDuration(progress.excess)}`
    : progress.remaining != null ? `Tempo restante: ${formatDashboardDuration(progress.remaining)}`
    : day.minutos_estudados > 0 ? 'Estudo realizado sem planejamento.' : 'Nenhum planejamento ou estudo.';
  return {
    progress,
    lines: [
      `Tempo planejado: ${formatDashboardDuration(day.minutos_planejados)}`,
      `Tempo realizado: ${formatDashboardDuration(day.minutos_estudados)}`,
      difference,
      `Cumprimento: ${formatStudyPercent(progress.percent)}`,
      `Situação: ${progress.status}`,
    ],
  };
}

export function DashboardStudyProgress({days}: {days: AnalysisDay[]}) {
  const hasTime = days.some(day => day.minutos_planejados > 0 || day.minutos_estudados > 0);
  return <DashboardCard className="study-progress-card">
    <DashboardCardHeader>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <CardTitle>Planejado × realizado</CardTitle>
        <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary tabular-nums">
          Cumprimento do período: {formatStudyPercent(periodStudyProgress(days))}
        </span>
      </div>
      <CardDescription>Acompanhe o cumprimento das suas metas diárias de estudo.</CardDescription>
    </DashboardCardHeader>
    <CardContent className="flex flex-1 flex-col gap-3">
      {hasTime ? <TooltipProvider delayDuration={120}>
        <div className="study-progress-scroll" role="region" aria-label="Cumprimento diário das metas de estudo" tabIndex={0}>
          <div className="study-progress-days">
            {days.map(day => {
              const {progress, lines} = dayDescription(day);
              const date = formatNumericDate(day.data);
              return <Tooltip key={day.data}>
                <TooltipTrigger asChild>
                  <button type="button" className="study-progress-day" aria-label={`${date}. ${lines.join('. ')}`}>
                    <span className="study-progress-track" style={{'--study-fill': `${progress.fill}%`} as CSSProperties}>
                      <span className="study-progress-fill" aria-hidden="true" />
                      <span className={`study-progress-percent ${progress.fill >= 20 ? 'study-progress-percent-filled' : ''}`}>
                        {formatStudyPercent(progress.percent)}{progress.percent != null && progress.percent > 100 && <span aria-hidden="true"> ↑</span>}
                      </span>
                    </span>
                    <span className="study-progress-date">{date.slice(0,5)}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="border border-border bg-popover p-3 text-popover-foreground [&>svg]:hidden">
                  <div className="space-y-1 leading-relaxed">
                    <p className="mb-2 font-semibold">Data: {date}</p>
                    {lines.map((line, index) => <p key={line} className={index === 4 ? progress.fill >= 100 ? 'text-dashboard-success' : progress.fill > 0 ? 'text-dashboard-attention' : 'text-muted-foreground' : undefined}>{line}</p>)}
                  </div>
                </TooltipContent>
              </Tooltip>;
            })}
          </div>
        </div>
      </TooltipProvider> : <DashboardEmptyPlot to="/cronograma" action="Planejar estudos">Nenhum planejamento ou estudo neste período.</DashboardEmptyPlot>}
    </CardContent>
  </DashboardCard>;
}
