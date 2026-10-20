import { DisciplineSummary, disciplineStudyState } from "@/components/disciplinas/DisciplineVisual";
import {BookOpen, Calendar, Clock, ListChecks} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {formatStudyMinutes} from '@/components/cronograma/PlanejamentoDisciplinas';
import {DIAS, diaAbrev} from '@/lib/cronograma/constants';
import {type Bloco, type Planejamento, type PlanejamentoResumo} from '@/lib/cronograma/types';
import {activityMinutes} from '@/lib/cronograma/activityPresentation';
import {cn} from '@/lib/utils';
import {MetricCard, type MetricTone} from "@/components/ui/metric-card";

export function CronogramaMetrics({plano, resumo}: {plano: Planejamento; resumo?: PlanejamentoResumo}) {
  const rows: {label:string; value:string; Icon:typeof Clock; tone:MetricTone}[] = [
    {label:'Horas planejadas na semana', value:resumo?formatStudyMinutes(resumo.minutos_planejados_semana):'—', Icon:Calendar, tone:'indigo'},
    {label:'Horas estudadas na semana', value:resumo?formatStudyMinutes(resumo.minutos_estudados_semana):'—', Icon:Clock, tone:'green'},
    {label:'Disciplinas cadastradas', value:String(plano.disciplinas.length), Icon:BookOpen, tone:'blue'},
    {label:'Progresso das atividades', value:resumo?`${resumo.progresso_pct.toFixed(0)}%`:'—', Icon:ListChecks, tone:'purple'},
  ];
  return <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do cronograma">{rows.map(({label,value,Icon,tone})=><MetricCard as="section" key={label} label={label} value={value} icon={Icon} tone={tone}>{tone==='purple'&&resumo&&<Progress className="h-1.5" value={resumo.progresso_pct} aria-label={`${resumo.progresso_pct.toFixed(0)}% das atividades concluídas`}/>}</MetricCard>)}</div>;
}

type Props = {plano:Planejamento; resumo?:PlanejamentoResumo; activities:Bloco[]; onViewAll:()=>void; loading?:boolean; error?:boolean; onRetry?:()=>void};
export function CronogramaWeeklyOverview({plano,resumo,activities,onViewAll,loading,error,onRetry}:Props) {
  const few=plano.disciplinas.length<=2;
  const daily=DIAS.map(day=>{const items=activities.filter(b=>b.dia_semana===day);return {day,count:items.length,minutes:items.reduce((sum,b)=>sum+activityMinutes(b),0)};});
  const total=daily.reduce((sum,day)=>sum+day.minutes,0);
  const max=Math.max(1,...daily.map(day=>day.minutes));
  return <div data-cronograma-section="weekly-overview" className={cn("grid min-w-0 items-start gap-4",!few&&"xl:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]")}>
    <section className="min-w-0 rounded-xl border border-border bg-card p-4"><h2 className="text-base font-semibold">Disciplinas da semana</h2><p className="mt-1 text-xs text-muted-foreground">Distribuição do tempo por disciplina</p><ul className={cn("mt-3 grid gap-3",few?(plano.disciplinas.length===1?"grid-cols-1":"sm:grid-cols-2"):"sm:grid-cols-2 xl:grid-cols-1")}>{plano.disciplinas.map(d=>{
      const stats=resumo?.disciplinas.find(s=>s.disciplina_id===d.disciplina_id);
      const planned=stats?.minutos_planejados??0, studied=stats?.minutos_estudados??0;
      const percent=planned>0?studied/planned*100:null;
      return <li key={d.disciplina_id} className="min-w-0"><DisciplineSummary id={d.disciplina_id} name={d.nome} state={disciplineStudyState(0,0,studied)} value={percent} label="Execução da carga semanal" context={stats?`${formatStudyMinutes(studied)} / ${formatStudyMinutes(planned)}`:'Sem dados da semana'}/></li>;
    })}</ul></section>
    <section className="min-w-0 rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Distribuição da carga semanal</h2><Button variant="ghost" size="sm" onClick={onViewAll}>Ver lista completa</Button></div>
      <p className="mt-1 text-xs text-muted-foreground">{loading?'Carregando atividades…':error?'Atividades indisponíveis':`${activities.length} atividades · ${formatStudyMinutes(total)} planejadas`}</p>
      {error?<Button variant="outline" className="mt-3" onClick={onRetry}>Tentar novamente</Button>:!loading&&<ul className={cn("mt-4 grid gap-3",few?"grid-cols-2 sm:grid-cols-4 xl:grid-cols-7":"sm:grid-cols-2")}>{daily.map(({day,count,minutes})=><li key={day} className="min-w-0 rounded-lg bg-muted/30 p-3"><div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium">{diaAbrev[day]}</span><span className="tabular-nums">{formatStudyMinutes(minutes)}</span></div><div role="meter" aria-label={`Carga de ${diaAbrev[day]}`} aria-valuenow={minutes} aria-valuemin={0} aria-valuemax={max} aria-valuetext={`${count} atividades, ${formatStudyMinutes(minutes)}`} className="my-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{width:`${minutes/max*100}%`}}/></div><p className="text-xs text-muted-foreground">{count? `${count} ${count===1?'atividade':'atividades'}`:'Sem atividades'}</p></li>)}</ul>}
      {!loading&&!error&&!activities.length&&<p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade nesta semana.</p>}
    </section>
  </div>;
}
