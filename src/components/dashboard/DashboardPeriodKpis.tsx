import { BookOpen, CheckCheck, Clock3, ListChecks } from "lucide-react";
import type { ComponentProps } from "react";

import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDashboardDuration, percentBR, type DashboardAnalysis } from "@/lib/dashboard/analysis";
import "./dashboard-soft-surfaces.css";

const numbers = new Intl.NumberFormat("pt-BR");
const metricClass = "dashboard-soft-kpi min-h-[11.5rem] rounded-2xl [&_.metric-card-icon]:size-11 [&_.metric-card-icon]:rounded-xl [&_.metric-card-icon>svg]:size-5 [&_h3]:text-sm [&_h3]:text-[color:var(--soft-ink)]";

function SoftMetric(props: ComponentProps<typeof MetricCard>) {
  return <MetricCard {...props} labelAs="h3" className={metricClass} />;
}

function MetricProgress({ label, value }: { label: string; value: number }) {
  return <Progress className="h-2 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
    value={Math.min(100, Math.max(0, value))} aria-label={label} aria-valuetext={percentBR(value)} />;
}

export function DashboardKpiSkeleton() {
  return (
    <div className="dashboard-kpi-shell" aria-label="Carregando indicadores" role="status">
      <div className="dashboard-kpi-grid">
        {["tempo", "questoes", "acertos", "edital"].map((metric) => (
          <div key={metric} className="flex min-h-[11.5rem] flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2"><Skeleton className="size-11 shrink-0 rounded-xl" /><Skeleton className="h-3 w-24" /></div>
            <Skeleton className="mt-1 h-8 w-16" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="mt-auto h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPeriodKpis({ data }: { data: DashboardAnalysis }) {
  const totals = data.totais;
  const goal = totals.meta_periodo_minutos;
  const goalPercent = goal && goal > 0 ? 100 * totals.minutos_estudados / goal : null;
  const accuracy = totals.questoes_total > 0 ? totals.acertos_pct : null;
  const syllabus = totals.topicos_total > 0 ? totals.progresso_edital_pct : null;
  const correctLabel = `${numbers.format(totals.acertos)} ${totals.acertos === 1 ? "acerto" : "acertos"}`;
  const wrongLabel = `${numbers.format(totals.erros)} ${totals.erros === 1 ? "erro" : "erros"}`;
  const questionLabel = `${numbers.format(totals.questoes_total)} ${totals.questoes_total === 1 ? "questão" : "questões"}`;

  return (
    <div className="dashboard-kpi-shell">
      <div className="dashboard-kpi-grid" aria-label="Indicadores de desempenho">
        <SoftMetric tone="indigo" icon={Clock3} label="Tempo estudado"
          value={formatDashboardDuration(totals.minutos_estudados)}
          description={goalPercent === null || goal === null ? "Meta não definida para o período" : `Meta do período · ${formatDashboardDuration(goal)}`}>
          {goalPercent !== null && (
            <div className="space-y-1">
              <p className="text-right text-xs font-semibold tabular-nums text-[color:var(--soft-ink)]">{percentBR(goalPercent)} da meta</p>
              <MetricProgress label="Meta do período atingida" value={goalPercent} />
            </div>
          )}
        </SoftMetric>
        <SoftMetric tone="blue" icon={ListChecks} label="Questões respondidas"
          value={numbers.format(totals.questoes_total)} description="Questões no período">
          <div className="flex flex-wrap gap-1.5 text-xs font-medium tabular-nums">
            <span className="inline-flex min-w-0 flex-1 basis-16 items-center gap-1 rounded-md bg-card/80 px-1.5 py-1 [overflow-wrap:anywhere]">
              <i className="size-1.5 shrink-0 rounded-full bg-dashboard-success" aria-hidden />{correctLabel}
            </span>
            <span className="inline-flex min-w-0 flex-1 basis-16 items-center gap-1 rounded-md bg-card/80 px-1.5 py-1 [overflow-wrap:anywhere]">
              <i className="size-1.5 shrink-0 rounded-full bg-dashboard-error" aria-hidden />{wrongLabel}
            </span>
          </div>
        </SoftMetric>
        <SoftMetric tone="green" icon={CheckCheck} label="Taxa de acertos" value={percentBR(accuracy)}
          description={`${correctLabel} em ${questionLabel}`}>
          {accuracy !== null ? <MetricProgress label="Taxa de acertos nas questões respondidas" value={accuracy} />
            : totals.questoes_total === 0 && <p className="text-xs font-medium text-[color:var(--soft-ink)]">Resolva questões para acompanhar seu desempenho.</p>}
        </SoftMetric>
        <SoftMetric tone="purple" icon={BookOpen} label="Progresso do edital"
          value={totals.topicos_total > 0 ? percentBR(syllabus) : "Sem tópicos"}
          description={totals.topicos_total > 0 ? `${numbers.format(totals.topicos_concluidos)} de ${numbers.format(totals.topicos_total)} tópicos concluídos` : "Nenhum tópico no edital"}>
          <div className="space-y-1">
            <p className="text-xs font-medium text-[color:var(--soft-ink)]">Progresso acumulado</p>
            {syllabus !== null && <MetricProgress label="Conclusão acumulada do edital" value={syllabus} />}
          </div>
        </SoftMetric>
      </div>
    </div>
  );
}
