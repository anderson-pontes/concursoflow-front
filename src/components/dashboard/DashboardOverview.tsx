import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { DIAS, diaAbrev, fmtBlocoMinutos, getTipoDot } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

type Summary = {
  horas_hoje: number;
  meta_horas: number;
  horas_semana: number;
  sessoes_semana: number;
  rendimento_medio: number;
  flashcards_para_revisar: number;
  streak_dias?: number;
  taxa_cumprimento_mes?: number;
  minutos_planejados_mes?: number;
  minutos_realizados_mes?: number;
};

function fmtHoras(hours: number) {
  if (hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const fullHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${fullHours}h ${minutes}min` : `${fullHours}h`;
}

const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function DashboardWeeklySchedule({
  schedule,
  today,
  disciplineNames,
}: {
  schedule?: Record<Bloco["dia_semana"], Bloco[]>;
  today: Bloco["dia_semana"];
  disciplineNames: Map<string, string>;
}) {
  const totalScheduled = DIAS.reduce((total, day) => total + (schedule?.[day]?.length ?? 0), 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground"><Calendar className="size-4" />Cronograma da semana</h2>
        {totalScheduled > 0 ? <Link to="/cronograma" className="inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline">Ver completo</Link> : null}
      </div>
      {totalScheduled === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Calendar className="size-5" /></span>
            <div>
              <p className="text-sm font-semibold text-foreground">Sua semana ainda não foi planejada</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie horários para visualizar aqui o próximo estudo.</p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link to="/cronograma">Planejar semana</Link></Button>
        </div>
      ) : (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7" role="region" aria-label="Cronograma da semana">
        {DIAS.map((day) => {
          const items = schedule?.[day] ?? [];
          const isToday = day === today;
          return (
            <div key={day} className={cn("flex min-h-[132px] flex-col rounded-lg border p-2", isToday ? "border-primary/50 bg-primary/5" : "border-border/60 bg-background/40")}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className={cn("text-xs font-semibold uppercase tracking-wide", isToday ? "text-primary" : "text-muted-foreground")}>{diaAbrev[day]}</p>
                {items.length > 0 ? <span className={cn("rounded-full px-1.5 text-xs font-medium tabular-nums", isToday ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{items.length}</span> : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {items.slice(0, 2).map((item) => (
                  <div key={item.id} className="rounded-md border border-border/50 bg-card px-1.5 py-1 shadow-sm">
                    <div className="flex items-center gap-1"><span className={cn("size-2 shrink-0 rounded-full", getTipoDot(item.tipo))} /><span className="truncate text-xs font-medium">{disciplineNames.get(item.disciplina_id) ?? "Disciplina"}</span></div>
                    {item.topico_nome ? <span className="mt-0.5 block truncate pl-3 text-xs text-muted-foreground">{item.topico_nome}</span> : null}
                    <span className="mt-0.5 block pl-3 text-xs tabular-nums text-muted-foreground">{item.hora_inicio}</span>
                  </div>
                ))}
                {items.length > 2 ? <Link to="/cronograma" className="mt-auto inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline">+{items.length - 2} mais</Link> : items.length === 0 ? <span className="mt-auto text-xs text-muted-foreground/50">—</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}

export function DashboardKpis({ summary }: { summary?: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <KpiCard label="Horas hoje" value={fmtHoras(summary?.horas_hoje ?? 0)} sub={`Meta: ${fmtHoras(summary?.meta_horas ?? 4)}`} progress={summary && summary.meta_horas > 0 ? Math.max(0, Math.min(100, Math.round((summary.horas_hoje / summary.meta_horas) * 100))) : 0} badgeVariant="amber" />
      <KpiCard label="Horas na semana" value={fmtHoras(summary?.horas_semana ?? 0)} sub="Últimos 7 dias" badgeVariant="amber" />
      <KpiCard label="Sequência" value={`${summary?.streak_dias ?? 0} dias`} sub="Dias consecutivos" badge={(summary?.streak_dias ?? 0) > 0 ? "Em dia" : "Comece hoje"} badgeVariant={(summary?.streak_dias ?? 0) > 0 ? "green" : "amber"} />
      <KpiCard label="Sessões" value={`${summary?.sessoes_semana ?? 0}`} sub="Esta semana" badgeVariant="amber" />
      <KpiCard label="Rendimento" value={`${(summary?.rendimento_medio ?? 0).toFixed(1)}%`} sub="Média no período" badgeVariant={(summary?.rendimento_medio ?? 0) > 0 ? "green" : "amber"} />
      <KpiCard label="Flashcards" value={compactNumber.format(summary?.flashcards_para_revisar ?? 0)} sub="Para revisar" badgeVariant={(summary?.flashcards_para_revisar ?? 0) > 0 ? "amber" : "green"} />
      <KpiCard label="Cumprimento mês" value={`${(summary?.taxa_cumprimento_mes ?? 0).toFixed(0)}%`} sub={`${fmtBlocoMinutos(summary?.minutos_realizados_mes ?? 0)} estudadas de ${fmtBlocoMinutos(summary?.minutos_planejados_mes ?? 0)} planejadas`} badgeVariant={(summary?.taxa_cumprimento_mes ?? 0) >= 80 ? "green" : "amber"} />
    </div>
  );
}
