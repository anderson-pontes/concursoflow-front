import React from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {TrendingUp} from 'lucide-react';
import {BannerSemConcurso} from '@/components/dashboard/BannerSemConcurso';
import {NextActionCard,UrgentReviewsCard} from '@/components/dashboard/DashboardPrimary';
import {AnalyticsState,DashboardPeriodKpis,DashboardDailyCharts,DashboardDisciplineCharts} from '@/components/dashboard/DashboardAnalytics';
import {DashboardTodayPlan} from '@/components/dashboard/DashboardTodayPlan';
import {DashboardMiniCalendar} from '@/components/dashboard/DashboardMiniCalendar';
import {DashboardComplementary} from '@/components/dashboard/DashboardComplementary';
import {HeatmapCard} from '@/components/dashboard/HeatmapCard';
import {Button} from '@/components/ui/button';
import {Alert,AlertTitle,AlertDescription} from '@/components/ui/alert';
import {PageSkeleton} from '@/components/ui/page-skeleton';
import {Skeleton} from '@/components/ui/skeleton';
import {DashboardContextHeader,DashboardPeriodFilter} from '@/components/dashboard/DashboardContextHeader';
import {dashboardRange,dashboardDayISO,resolveNextStudyStatus,todaySessionWithTimer,type DashboardPeriod,type TodaySession} from '@/lib/dashboard/analysis';
import {calendarDaysFromToday} from '@/lib/dashboard/dates';
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
 const nextStudyStatus=next.data?resolveNextStudyStatus(next.data,today,todayPlan):undefined;
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
 return <div className="min-w-0 space-y-5 pb-8">
  <DashboardContextHeader contest={contest} daysUntilExam={days}><DashboardPeriodFilter value={period} onValueChange={setPeriod} range={range}/></DashboardContextHeader>
  <section aria-labelledby="dashboard-evolution" className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h2 id="dashboard-evolution" className="text-lg font-semibold tracking-tight">Como estou evoluindo?</h2><p className="mt-0.5 text-sm text-muted-foreground">Acompanhe seu desempenho e suas metas de estudo.</p></div><TrendingUp className="size-5 shrink-0 text-primary" aria-hidden/></div>
  <AnalyticsState cause={analysis.error} loading={analysis.isLoading} error={analysis.isError} retry={()=>void analysis.refetch()}/>
  {!analysis.isError&&analysis.data&&<DashboardPeriodKpis data={analysis.data}/>}
  </section>
  <section aria-labelledby="dashboard-now" className="space-y-3"><h2 id="dashboard-now" className="text-base font-semibold">O que estudar agora?</h2>
  <div data-dashboard-row="actions" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-2">
   {next.isLoading?<Skeleton className="h-48 rounded-xl xl:h-full xl:min-h-48"/>:<NextActionCard compact concursoId={concursoId} study={next.data} studyStatus={nextStudyStatus} registering={Boolean(prefill)} state={actionState} isError={next.isError} onRetry={()=>void next.refetch()} onStart={()=>trackTelemetry('next_action_started',{action_type:'study',source:'dashboard'})} onManual={()=>{if(!next.data)return;const s=next.data;setPrefill({disciplinaId:s.disciplina_id,topicoId:s.topico_id,blocoId:s.fonte==='bloco_semanal'?s.item_id:undefined,itemId:s.fonte==='cronograma_item'?s.item_id:undefined,dataReferencia:s.data});trackTelemetry('manual_study_opened',{source:'dashboard'});}} replanUrl={`/planos/${concursoId}/replanejar`}/>}
   {analysis.isLoading?<Skeleton className="h-48 rounded-xl xl:h-full xl:min-h-48"/>:<DashboardTodayPlan concursoId={concursoId} items={todayPlan} day={today} studiedMinutes={analysis.data?.plano_hoje_minutos_estudados} onRegister={register} error={analysis.isError} retry={()=>void analysis.refetch()}/>}
  </div>
  </section>
  {!analysis.isError&&analysis.data&&<DashboardDailyCharts data={analysis.data}/>}
  <section aria-labelledby="dashboard-improve" className="space-y-4">
  <div><h2 id="dashboard-improve" className="text-lg font-semibold tracking-tight">Onde posso melhorar?</h2><p className="mt-0.5 text-sm text-muted-foreground">Acompanhe o avanço no edital e veja onde investiu seu tempo de estudo.</p></div>
  {analysis.isError?<AnalyticsState cause={analysis.error} loading={false} error retry={()=>void analysis.refetch()}/>:<DashboardDisciplineCharts key={concursoId} data={analysis.data}/>}
  <div className="dashboard-summary-section"><div data-dashboard-row="complementary" className="dashboard-summary-grid grid gap-4">
   <UrgentReviewsCard reviews={reviews.data?.items??[]} total={reviews.data?.total??0} isError={reviews.isError} isLoading={reviews.isLoading} onRetry={()=>void reviews.refetch()}/>
   <DashboardComplementary summary={summary} notices={notices}/>
  </div></div>
  <div className="dashboard-activity-shell">
   <div data-dashboard-row="tracking" className="dashboard-activity-grid grid items-start gap-4">
    <HeatmapCard key={concursoId} data={heatmap.data ?? []} scopeLabel="Concurso ativo" endDate={today} historyHref="/estudos/historico"
      isLoading={heatmap.isLoading} isError={heatmap.isError} onRetry={()=>void heatmap.refetch()}/>
    <DashboardMiniCalendar timezone={timezone} concursoId={concursoId} disciplines={new Map(analysis.data?.disciplinas.map(d=>[d.id,d]))}/>
   </div>
  </div>
  </section>
  {prefill&&<React.Suspense fallback={null}><RegistroEstudoModal open onClose={()=>setPrefill(null)} defaultDisciplinaId={prefill.disciplinaId} defaultBlocoId={prefill.blocoId} defaultCronogramaItemId={prefill.itemId} defaultDataReferencia={prefill.dataReferencia} defaultConcursoId={concursoId} defaultTopicos={prefill.topicoId?[{id:prefill.topicoId,nome:''}]:null}/></React.Suspense>}
 </div>;
}
