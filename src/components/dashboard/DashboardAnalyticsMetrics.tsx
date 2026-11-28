import { Progress } from "@/components/ui/progress";
import { formatDashboardDuration } from "@/lib/dashboard/analysis";
import { formatStudyPercent, studyProgress } from "@/lib/dashboard/studyProgress";

export function SyllabusCoverage({ completed, total, withoutTopics }: { completed: number; total: number; withoutTopics: number }) {
  const percent = total > 0 ? completed / total * 100 : null;

  return <section aria-label="Cobertura geral do edital" className="space-y-1 rounded-lg bg-muted/35 px-3 py-2">
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
      <h4 className="font-semibold">Cobertura geral do edital</h4>
      {percent !== null && <span className="font-semibold tabular-nums text-primary">{formatStudyPercent(percent)}</span>}
    </div>
    {percent === null
      ? <p className="text-xs text-muted-foreground">Cadastre tópicos no edital para acompanhar seu avanço.</p>
      : <Progress value={percent} aria-label="Conclusão geral dos tópicos do edital" className="h-1.5 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none" />}
    {withoutTopics > 0 && <p className="text-xs text-muted-foreground">
      {withoutTopics} {withoutTopics === 1 ? "disciplina sem tópicos cadastrados" : "disciplinas sem tópicos cadastrados"}
    </p>}
  </section>;
}

export function PeriodPlanComparison({ planned, studied }: { planned: number; studied: number }) {
  const { percent, fill, remaining, excess, status } = studyProgress(planned, studied);
  const surface = "dashboard-period-insight min-w-0 rounded-xl px-3 py-2.5";
  if (percent === null) return <section aria-label="Planejado × Realizado" className={`${surface} flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1`}>
    <h4 className="text-sm font-semibold">Planejado × Realizado</h4>
    <p className="text-xs text-muted-foreground">Sem tempo planejado no período.</p>
  </section>;

  const reached = studied >= planned;
  const difference = excess ? "Tempo excedente" : "Tempo restante";
  const percentLabel = formatStudyPercent(percent);

  return <section aria-label="Planejado × Realizado" className={`${surface} space-y-2`}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
      <h4 className="text-sm font-semibold">Planejado × Realizado</h4>
      <p className={`text-xs font-semibold tabular-nums ${reached ? "text-success-text" : "text-primary"}`}>
        {reached ? `${status} · ${percentLabel}` : `${percentLabel} de cumprimento`}
      </p>
    </div>
    <dl className="grid grid-cols-3 gap-x-2 text-xs">
      <div className="min-w-0">
        <dt className="text-muted-foreground">Planejado</dt>
        <dd className="font-semibold tabular-nums text-[color:var(--study-indigo-ink)]">{formatDashboardDuration(planned)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-muted-foreground">Realizado</dt>
        <dd className="font-semibold tabular-nums text-[color:var(--study-emerald-ink)]">{formatDashboardDuration(studied)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-muted-foreground">{difference}</dt>
        <dd className={`font-semibold tabular-nums ${reached ? "text-success-text" : "text-warning-foreground"}`}>
          {formatDashboardDuration(excess || remaining || 0)}
        </dd>
      </div>
    </dl>
    <Progress value={fill} aria-label="Cumprimento do tempo planejado"
      aria-valuetext={`${percentLabel} do tempo planejado`}
      className={`h-1.5 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none ${reached ? "[&_[data-slot=progress-indicator]]:bg-[var(--study-emerald)]" : ""}`} />
  </section>;
}
