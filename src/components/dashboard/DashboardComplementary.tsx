import {Link} from 'react-router-dom';
import {Flame,Layers} from 'lucide-react';
import type {UseQueryResult} from '@tanstack/react-query';
import {CardTitle,CardDescription} from '@/components/ui/card';
import {DashboardCard,DashboardCardHeader,DashboardCardBody,DashboardCardActions} from '@/components/dashboard/DashboardCard';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {formatDashboardDuration as fmtMinutosEstudo,percentBR} from '@/lib/dashboard/analysis';
import {formatNumericDate} from '@/lib/dashboard/dates';
import type {DashboardSummary,DashboardNotice} from '@/hooks/useDashboardAnalysis';
export function DashboardComplementary({summary,notices}:{summary:UseQueryResult<DashboardSummary>;notices:UseQueryResult<DashboardNotice[]>}) {
 return <>
  <DashboardCard><DashboardCardHeader><CardTitle className="flex items-center gap-2"><Layers className="size-5 text-dashboard-flashcards" aria-hidden/>Flashcards e constância</CardTitle><CardDescription>Revisão e acompanhamento do mês atual</CardDescription></DashboardCardHeader><DashboardCardBody>
   {summary.isError?<div><p role="alert" className="text-sm">Indicadores indisponíveis.</p><Button variant="outline" className="mt-2" onClick={()=>void summary.refetch()}>Tentar novamente</Button></div>:summary.isLoading?<Skeleton className="h-24"/>:<div className="space-y-3"><p className="text-sm"><strong>{summary.data?.flashcards_para_revisar??'—'}</strong> flashcards para revisar</p><p className="text-sm"><Flame className="mr-1 inline size-4 text-dashboard-attention" aria-hidden/>{summary.data?.streak_dias??'—'} dias de sequência</p><div className="space-y-1 text-xs text-muted-foreground"><p>Meta mensal: {summary.data&&summary.data.minutos_planejados_mes>0?percentBR(summary.data.taxa_cumprimento_mes):'Sem planejamento mensal'}</p>{summary.data&&<p>{fmtMinutosEstudo(summary.data.minutos_realizados_mes)} de {fmtMinutosEstudo(summary.data.minutos_planejados_mes)} planejadas · mês atual</p>}</div></div>}
   <DashboardCardActions><Button asChild variant="ghost" className="ml-auto"><Link to="/flashcards">Revisar flashcards</Link></Button></DashboardCardActions>
  </DashboardCardBody></DashboardCard>
  <DashboardCard><DashboardCardHeader><CardTitle>Avisos próximos</CardTitle><CardDescription>Prazos dos próximos 7 dias</CardDescription></DashboardCardHeader><DashboardCardBody>
   {notices.isError?<div><p role="alert" className="text-sm">Avisos indisponíveis.</p><Button variant="outline" className="mt-2" onClick={()=>void notices.refetch()}>Tentar novamente</Button></div>:notices.isLoading?<Skeleton className="h-24"/>:notices.data?.length?<ul className="space-y-2">{notices.data.slice(0,4).map(a=><li key={a.id} className="rounded-lg bg-muted/30 p-2"><p className="break-words text-sm font-medium">{a.titulo}</p><p className="text-xs text-muted-foreground">{formatNumericDate(a.data_vencimento)}</p></li>)}</ul>:<p className="text-sm text-muted-foreground">Nenhum aviso nos próximos 7 dias.</p>}
   <DashboardCardActions><Button asChild variant="ghost" className="ml-auto"><Link to="/avisos">Ver todos</Link></Button></DashboardCardActions>
  </DashboardCardBody></DashboardCard>
 </>;
}
