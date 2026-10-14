import {useQuery} from '@tanstack/react-query';
import {api} from '@/services/api';
import {retryApiQuery} from '@/lib/apiQuery';
import type {DashboardContest,NextStudy,PendingReview} from '@/components/dashboard/DashboardPrimary';
import type {DashboardAnalysis} from '@/lib/dashboard/analysis';
import {calendarDaysFromToday} from '@/lib/dashboard/dates';
export type DashboardSummary={horas_hoje:number;meta_horas:number;flashcards_para_revisar:number;streak_dias:number;taxa_cumprimento_mes:number;minutos_planejados_mes:number;minutos_realizados_mes:number};
export type DashboardNotice={id:string;titulo:string;data_vencimento:string};
export function useDashboardAnalysis(concursoId:string|null,range:{inicio:string;fim:string},enabled:boolean) {
 const contests=useQuery({queryKey:['concursos'],queryFn:async()=>(await api.get('/concursos')).data as (DashboardContest&{id:string})[]});
 const analysis=useQuery({retry:retryApiQuery,queryKey:['dashboard','analise',concursoId,range.inicio,range.fim],queryFn:async()=>(await api.get<DashboardAnalysis>('/dashboard/analise',{params:{concurso_id:concursoId,...range}})).data,enabled});
 const summary=useQuery({queryKey:['dashboard-resumo',concursoId],queryFn:async()=>(await api.get<DashboardSummary>('/dashboard/resumo',{params:{concurso_id:concursoId}})).data,enabled});
 const next=useQuery({queryKey:['dashboard','proximo-estudo',concursoId],queryFn:async()=>(await api.get<(NextStudy&{item_id:string})|null>('/dashboard/proximo-estudo',{params:{concurso_id:concursoId}})).data,enabled});
 const reviews=useQuery({queryKey:['dashboard','revisoes-pendentes',concursoId],queryFn:async()=>(await api.get<{total:number;items:PendingReview[]}>('/dashboard/revisoes-pendentes',{params:{concurso_id:concursoId}})).data,enabled});
 const heatmap=useQuery({queryKey:['dashboard-heatmap',concursoId],queryFn:async()=>(await api.get<{date:string;count:number;minutes?:number}[]>('/dashboard/heatmap',{params:{concurso_id:concursoId}})).data,enabled});
 const notices=useQuery({queryKey:['avisos-concurso',concursoId],queryFn:async()=>(await api.get<DashboardNotice[]>(`/avisos/concurso/${concursoId}`)).data.filter(a=>{const n=calendarDaysFromToday(a.data_vencimento);return n>=0&&n<=7;}),enabled});
 return {contests,analysis,summary,next,reviews,heatmap,notices};
}
