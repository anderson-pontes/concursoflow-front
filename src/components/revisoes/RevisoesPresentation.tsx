import { AlertCircle, CalendarDays, CheckCircle2, Clock3, EyeOff, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RevisaoGrupo } from "@/types/revisao";
import "@/components/revisoes/revisoes.css";

export function RevisoesContest({nome}:{nome:string}) {
  return <TooltipProvider><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="inline-flex w-fit min-w-0 max-w-full items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-w-xs"><GraduationCap className="size-4 shrink-0" aria-hidden /><span className="truncate">{nome}</span></span></TooltipTrigger><TooltipContent className="max-w-[min(24rem,calc(100vw-32px))] whitespace-normal [overflow-wrap:anywhere]">{nome}</TooltipContent></Tooltip></TooltipProvider>;
}

export const REVIEW_GROUPS = [
  {value:"hoje", label:"Hoje", metric:"Para hoje", description:"Programadas para hoje", Icon:CalendarDays, tone:"indigo"},
  {value:"atrasadas", label:"Atrasadas", metric:"Atrasadas", description:"Precisam de atenção", Icon:AlertCircle, tone:"purple"},
  {value:"proximas", label:"Próximas", metric:"Próximas", description:"Revisões agendadas", Icon:Clock3, tone:"orange"},
  {value:"concluidas", label:"Concluídas", metric:"Concluídas", description:"Revisões realizadas", Icon:CheckCircle2, tone:"green"},
  {value:"ignoradas", label:"Ignoradas", metric:"Ignoradas", description:"", Icon:EyeOff, tone:"indigo"},
] as const;

export function RevisoesSummary({resumo,loading}:{resumo?:Record<RevisaoGrupo,number>|null;loading:boolean}) {
  return <section aria-label="Resumo das revisões" aria-busy={loading} className="space-y-2">
    <div className="reviews-summary-grid">{REVIEW_GROUPS.slice(0,4).map(group => <MetricCard key={group.value} data-review-group={group.value} className={group.value === "atrasadas" ? "reviews-overdue-metric" : undefined} label={group.metric} icon={group.Icon} tone={group.tone} value={loading ? <Skeleton className="h-8 w-12" /> : resumo?.[group.value] ?? "—"} description={group.description} />)}</div>
    {!loading && !resumo && <p className="text-xs text-muted-foreground">Totais indisponíveis no momento.</p>}
  </section>;
}

const EMPTY_COPY:Record<RevisaoGrupo,{title:string;description:string}> = {
  hoje:{title:"Você não tem revisões programadas para hoje.",description:"Consulte as próximas revisões para acompanhar seu planejamento."},
  atrasadas:{title:"Nenhuma revisão atrasada.",description:"Não há revisões pendentes de datas anteriores neste momento."},
  proximas:{title:"Não há próximas revisões agendadas.",description:"As próximas revisões aparecerão aqui quando forem programadas."},
  concluidas:{title:"Nenhuma revisão concluída neste filtro.",description:"As revisões realizadas aparecerão aqui após a conclusão."},
  ignoradas:{title:"Nenhuma revisão ignorada.",description:"As revisões ignoradas aparecerão neste grupo."},
};
export function RevisoesEmpty({grupo,filtered,resumo,onClear,onNext}:{grupo:RevisaoGrupo;filtered:boolean;resumo?:Record<RevisaoGrupo,number>|null;onClear:()=>void;onNext:()=>void}) {
  const group = REVIEW_GROUPS.find(item=>item.value===grupo)!;
  const Icon = group.Icon;
  const hasFuture = (resumo?.proximas ?? 0) > 0;
  const noReviews = !filtered && grupo === "hoje" && resumo != null && REVIEW_GROUPS.every(item => resumo[item.value] === 0);
  const title = filtered ? "Nenhuma revisão encontrada para os filtros selecionados." : noReviews ? "Nenhuma revisão disponível neste concurso." : EMPTY_COPY[grupo].title;
  const description = filtered ? "Ajuste ou limpe os filtros para ampliar os resultados." : noReviews ? "Organize seus estudos no Cronograma. As revisões aparecerão aqui quando forem programadas." : grupo === "hoje" && !hasFuture ? "As revisões de hoje aparecerão aqui quando forem programadas." : EMPTY_COPY[grupo].description;
  return <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-8 text-center" role="status">
    <span className="review-status flex size-10 items-center justify-center rounded-xl" data-group={grupo}><Icon className="size-5" aria-hidden /></span>
    <div className="max-w-lg space-y-1"><h2 className="text-base font-semibold">{title}</h2><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    {filtered ? <Button type="button" variant="outline" className="min-h-11" onClick={onClear}>Limpar filtros</Button> : noReviews ? <Button asChild variant="outline" className="min-h-11"><Link to="/cronograma">Ver cronograma</Link></Button> : grupo==="hoje" && hasFuture ? <Button type="button" variant="outline" className="min-h-11" onClick={onNext}>Ver próximas revisões</Button> : null}
  </div>;
}
