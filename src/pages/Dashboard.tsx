import React from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {BannerSemConcurso} from '@/components/dashboard/BannerSemConcurso';
import {DashboardContextHeader,NextActionCard,UrgentReviewsCard} from '@/components/dashboard/DashboardPrimary';
import {AnalyticsState,DashboardPeriodKpis,DashboardDailyCharts,DashboardDisciplineCharts} from '@/components/dashboard/DashboardAnalytics';
import {DashboardTodayPlan} from '@/components/dashboard/DashboardTodayPlan';
import {DashboardMiniCalendar} from '@/components/dashboard/DashboardMiniCalendar';
import {DashboardComplementary} from '@/components/dashboard/DashboardComplementary';
import {HeatmapCard} from '@/components/dashboard/HeatmapCard';
import {Button} from '@/components/ui/button';
import {Alert,AlertTitle,AlertDescription} from '@/components/ui/alert';
import {PageSkeleton} from '@/components/ui/page-skeleton';
import {Skeleton} from '@/components/ui/skeleton';
import {SelectField} from '@/components/ui/select-field';
import {dashboardRange,dashboardDayISO,todaySessionWithTimer,type DashboardPeriod,type TodaySession} from '@/lib/dashboard/analysis';
import {calendarDaysFromToday,formatNumericDate} from '@/lib/dashboard/dates';
import {resolveDashboardActionState} from '@/lib/dashboard/presentation';
import {useDashboardAnalysis} from '@/hooks/useDashboardAnalysis';
import {trackTelemetry} from '@/services/telemetry';
import {useConcursoAtivoId,useConcursoContextResolved,useConcursoContextError} from '@/stores/concursoStore';
import {usePomodoroStore} from '@/stores/pomodoroStore';
import {usePomodoroSessionStore} from '@/stores/pomodoroSessionStore';

type Prefill={disciplinaId:string;topicoId?:string|null;blocoId?:string;itemId?:string;dataReferencia?:string};
const RegistroEstudoModal=React.lazy(async()=>({default:(await import('@/components/estudos/RegistroEstudoModal')).RegistroEstudoModal}));
export function Dashboard() {
 const qc=useQueryClient();const concursoId=useConcursoAtivoId();const resolved=useConcursoContextResolved();const contextError=useConcursoContextError();
 const [period,setPeriod]=React.useState<DashboardPeriod>('week');
 const [timezone,setTimezone]=React.useState('America/Sao_Paulo');
 const today=dashboardDayISO(timezone);const userDate=new Date(`${today}T12:00:00`);
 const range=dashboardRange(period,userDate);const enabled=resolved&&Boolean(concursoId)&&!contextError;
 const [prefill,setPrefill]=React.useState<Prefill|null>(null);
 const {contests,analysis,summary,next,reviews,heatmap,notices}=useDashboardAnalysis(concursoId,range,enabled);
 React.useEffect(()=>{if(analysis.data?.timezone)setTimezone(analysis.data.timezone);},[analysis.data?.timezone]);
 const activity=usePomodoroStore(s=>s.activityContext);const hasSession=usePomodoroSessionStore(s=>s.hasSession);const phase=usePomodoroSessionStore(s=>s.phase);
 const todayPlan=React.useMemo(()=>analysis.data?.plano_hoje.map(item=>todaySessionWithTimer(item,activity,concursoId,hasSession&&phase==='foco'))??[],[analysis.data,activity,concursoId,hasSession,phase]);
 const contest=contests.data?.find(c=>c.id===concursoId);
 const days=contest?.data_prova?calendarDaysFromToday(contest.data_prova,userDate):null;
 const state=resolveDashboardActionState({contextStatus:'ready',overdueReviews:reviews.data?.items.filter(r=>r.dias_atraso>0).length??0,daysUntilExam:days,hoursToday:summary.data?.horas_hoje??0,dailyGoalHours:summary.data?.meta_horas??0});
 const actionState=state&&state!=='no_plan'&&state!=='empty_plan'?state:'ready';
 const seen=React.useRef<string|null>(null);
 React.useEffect(()=>{if(!enabled||summary.isLoading||reviews.isLoading)return;const key=`${concursoId}:${actionState}`;if(key!==seen.current){seen.current=key;trackTelemetry('next_action_viewed',{state:actionState});}},[enabled,concursoId,actionState,summary.isLoading,reviews.isLoading]);
 const register=(item:TodaySession)=>{setPrefill({disciplinaId:item.disciplina_id,topicoId:item.topico_id,blocoId:item.fonte==='bloco_semanal'?(item.bloco_cronograma_id??item.id):undefined,itemId:item.fonte==='cronograma_item'?item.id:undefined,dataReferencia:item.data});trackTelemetry('manual_study_opened',{source:'schedule'});};
 if(!resolved)return <PageSkeleton cards={4} rows={2}/>;
 if(contextError||contests.isError)return <div className="space-y-4"><h1 className="text-2xl font-semibold">Painel</h1><Alert variant="destructive"><AlertTitle>Não foi possível carregar o concurso ativo</AlertTitle><AlertDescription>Os dados anteriores foram ocultados.<Button variant="outline" className="mt-3 block" onClick={()=>void qc.invalidateQueries({queryKey:['concursos']})}>Tentar novamente</Button></AlertDescription></Alert></div>;
 if(!concursoId)return <div className="space-y-6"><h1 className="text-2xl font-semibold">Painel</h1><BannerSemConcurso/></div>;
 if(contests.isLoading)return <PageSkeleton cards={4} rows={2}/>;
 if(!contest)return <div className="space-y-6"><h1 className="text-2xl font-semibold">Painel</h1><BannerSemConcurso/></div>;
 return <div className="space-y-5 pb-8">
  <DashboardContextHeader contest={contest} daysUntilExam={days}/>
  <div className="flex flex-wrap items-center justify-between gap-3">{!contest.data_prova?<Link to="/concursos" className="text-sm font-medium text-primary underline">Cadastrar data da prova</Link>:<span className="text-xs text-muted-foreground">Acompanhamento do concurso ativo</span>}<div className="flex flex-wrap items-center gap-3"><SelectField aria-label="Período do dashboard" className="w-44" value={period} onValueChange={v=>setPeriod(v as DashboardPeriod)} options={[{value:'week',label:'Esta semana'},{value:'month',label:'Este mês'},{value:'30days',label:'Últimos 30 dias'}]}/><p className="text-xs text-muted-foreground">{formatNumericDate(range.inicio)} a {formatNumericDate(range.fim)}</p></div></div>
  <AnalyticsState cause={analysis.error} loading={analysis.isLoading} error={analysis.isError} retry={()=>void analysis.refetch()}/>
  {!analysis.isError&&analysis.data&&<DashboardPeriodKpis data={analysis.data}/>}
  <div data-dashboard-row="actions" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-2">
   {next.isLoading?<Skeleton className="h-48 rounded-xl"/>:<NextActionCard compact study={next.data} state={actionState} isError={next.isError} onRetry={()=>void next.refetch()} onStart={()=>trackTelemetry('next_action_started',{action_type:'study',source:'dashboard'})} onManual={()=>{if(!next.data)return;const s=next.data;setPrefill({disciplinaId:s.disciplina_id,topicoId:s.topico_id,blocoId:s.fonte==='bloco_semanal'?s.item_id:undefined,itemId:s.fonte==='cronograma_item'?s.item_id:undefined,dataReferencia:s.data});trackTelemetry('manual_study_opened',{source:'dashboard'});}} replanUrl={`/planos/${concursoId}/replanejar`}/>}
   {analysis.isLoading?<Skeleton className="h-48 rounded-xl"/>:<DashboardTodayPlan items={todayPlan} onRegister={register} error={analysis.isError} retry={()=>void analysis.refetch()}/>}
  </div>
  {!analysis.isError&&analysis.data&&<><DashboardDailyCharts data={analysis.data}/><DashboardDisciplineCharts data={analysis.data}/></>}
  <div data-dashboard-row="tracking" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-2"><HeatmapCard className="flex flex-col xl:h-full xl:self-stretch" data={heatmap.data??[]} scopeLabel="Concurso ativo" endDate={today} isLoading={heatmap.isLoading} isError={heatmap.isError} onRetry={()=>void heatmap.refetch()}/><DashboardMiniCalendar timezone={timezone} concursoId={concursoId} disciplineNames={new Map(analysis.data?.disciplinas.map(d=>[d.id,d.nome]))}/></div>
  <div data-dashboard-row="complementary" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-3">{reviews.isLoading?<Skeleton className="h-36 rounded-xl"/>:<UrgentReviewsCard reviews={reviews.data?.items??[]} total={reviews.data?.total??0} isError={reviews.isError} onRetry={()=>void reviews.refetch()}/>}<DashboardComplementary summary={summary} notices={notices}/></div>
  {prefill&&<React.Suspense fallback={null}><RegistroEstudoModal open onClose={()=>setPrefill(null)} defaultDisciplinaId={prefill.disciplinaId} defaultBlocoId={prefill.blocoId} defaultCronogramaItemId={prefill.itemId} defaultDataReferencia={prefill.dataReferencia} defaultConcursoId={concursoId} defaultTopicos={prefill.topicoId?[{id:prefill.topicoId,nome:''}]:null}/></React.Suspense>}
 </div>;
}
