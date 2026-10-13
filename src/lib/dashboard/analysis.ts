export type DashboardPeriod = 'week' | 'month' | '30days';
export type AnalysisDay = {data:string;minutos_planejados:number;minutos_estudados:number;questoes_total:number;acertos:number;acertos_pct:number|null};
export type AnalysisDiscipline = {id:string;nome:string;topicos_total:number;topicos_concluidos:number;progresso_pct:number|null;minutos_estudados:number;participacao_tempo_pct:number};
export type TodaySession = {id:string;fonte:'cronograma_item'|'bloco_semanal';bloco_cronograma_id?:string|null;disciplina_id:string;disciplina_nome:string;topico_id:string|null;topico_nome:string|null;data:string;hora_inicio:string|null;hora_fim:string|null;duracao_minutos:number;status:'planejada'|'em_andamento'|'concluida'|'atrasada'};
export type DashboardAnalysis = {
 inicio:string;fim:string;timezone:string;
 totais:{minutos_planejados:number;minutos_estudados:number;meta_periodo_minutos:number|null;sessoes:number;questoes_total:number;acertos:number;erros:number;acertos_pct:number|null;topicos_total:number;topicos_concluidos:number;progresso_edital_pct:number|null};
 dias:AnalysisDay[];disciplinas:AnalysisDiscipline[];plano_hoje:TodaySession[];
};
export function localDateISO(date:Date) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function dashboardDayISO(timezone='America/Sao_Paulo',now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(name:string)=>parts.find(p=>p.type===name)?.value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
export function dashboardRange(period:DashboardPeriod, today=new Date()) {
 const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 const end=new Date(start);
 if(period==='week'){start.setDate(start.getDate()-((start.getDay()+6)%7));end.setTime(start.getTime());end.setDate(end.getDate()+6);}
 else if(period==='month'){start.setDate(1);end.setMonth(end.getMonth()+1,0);}
 else start.setDate(start.getDate()-29);
 return {inicio:localDateISO(start),fim:localDateISO(end)};
}
export const percentBR=(value:number|null|undefined)=>value==null?'Sem dados':`${value.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
export function formatDashboardDuration(value:number) {
 const minutes=Math.max(0,Math.round(value));
 if(minutes<60)return `${minutes} min`;
 const hours=Math.floor(minutes/60),rest=minutes%60;
 return rest?`${hours}h ${rest}min`:`${hours}h`;
}
export function todaySessionWithTimer(item:TodaySession,context:{concursoId?:string;dataReferencia?:string;itemId?:string;blocoId?:string}|null,concursoId:string|null,active:boolean):TodaySession {
 const linked=context?.itemId===item.id||(item.bloco_cronograma_id!=null&&context?.blocoId===item.bloco_cronograma_id)||(item.fonte==='bloco_semanal'&&context?.blocoId===item.id);
 const current=active&&context?.concursoId===concursoId&&context?.dataReferencia===item.data&&linked;
 return current&&item.status!=='concluida'?{...item,status:'em_andamento'}:item;
}
