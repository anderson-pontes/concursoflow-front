import { Brain, Flame, Layers } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
type Props={totalCardsGlobal:number;globalStreak:number;dueTodayTotal:number;avgDominio:number;showDeckMetrics:boolean;loading?:boolean;metricsError?:boolean};
export function FlashcardsStatsHeader({totalCardsGlobal,globalStreak,dueTodayTotal,avgDominio,showDeckMetrics,loading,metricsError}:Props) {
  const value=(number:number)=>loading?<Skeleton className="h-8 w-16"/>:metricsError?"—":number;
  return <div className="space-y-4"><header><h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1><p className="mt-1 text-sm text-muted-foreground">Memorize conteúdos com repetição espaçada e acompanhe sua evolução.</p></header>
    <section aria-label="Indicadores de flashcards" aria-busy={loading} className="flashcards-kpis">
      <MetricCard label="Total de cartões" value={value(totalCardsGlobal)} description="Cartões cadastrados" icon={Layers} tone="indigo" />
      <MetricCard label="Sequência de estudos" value={`${globalStreak} ${globalStreak===1?"dia":"dias"}`} description="Dias consecutivos de revisão" icon={Flame} tone="orange" />
      <MetricCard label="Revisões de hoje" value={value(dueTodayTotal)} description="Cartões para revisar" icon={Brain} tone="green" />
    </section>
    {showDeckMetrics&&!loading&&!metricsError&&<p className="text-xs text-muted-foreground">Domínio médio dos baralhos: <span className="font-semibold">{avgDominio}%</span></p>}
  </div>;
}
