import { CalendarDays, CheckCircle2, Clock3, Flag, Target, Timer } from "lucide-react";
import type { CalendarioResumoMes as Resumo } from "@/lib/calendario/types";
import { fmtMinutosEstudo, fmtDuracaoCalendario } from "@/lib/calendario/format";
import { MetricCard, type MetricTone } from "@/components/ui/metric-card";
import "@/components/calendario/calendario.css";

type Props = { resumo: Resumo | undefined; compact?: boolean; loading?:boolean };
export function CalendarioResumoMes({ resumo, compact, loading=false }: Props) {
  if (!resumo && (!loading || compact)) return null;
  if (compact && resumo) return <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span><strong className="text-foreground">{resumo.taxa_cumprimento_pct.toFixed(0)}%</strong> cumprimento</span><span>{fmtMinutosEstudo(resumo.minutos_realizados)} estudados</span><span>{resumo.dias_cumpridos} dias ok</span></div>;
  const cards: {label:string;value:string;icon:typeof Target;tone:MetricTone}[] = [
    {label:"Cumprimento",value:`${resumo?.taxa_cumprimento_pct.toFixed(0)??0}%`,icon:Target,tone:"indigo"},
    {label:"Dias cumpridos",value:`${resumo?.dias_cumpridos??0}/${resumo?.dias_com_planejamento||"—"}`,icon:CheckCircle2,tone:"green"},
    {label:"Parciais",value:String(resumo?.dias_parciais??0),icon:Clock3,tone:"orange"},
    {label:"Pendentes",value:String(resumo?.dias_nao_cumpridos??0),icon:Flag,tone:"purple"},
    {label:"Realizado",value:fmtDuracaoCalendario(resumo?.minutos_realizados??0),icon:Timer,tone:"blue"},
    {label:"Planejado",value:fmtDuracaoCalendario(resumo?.minutos_planejados??0),icon:CalendarDays,tone:"indigo"},
  ];
  return <section aria-label="Resumo do mês" aria-busy={loading} className="calendar-summary"><div className="calendar-summary-grid">{cards.map(card=><MetricCard key={card.label} {...card} value={loading?<span className="block h-8 w-16 animate-pulse rounded bg-muted" aria-label="Carregando"/>:card.value}/>)}</div></section>;
}
