import {BookOpen, Calendar, Clock, ListChecks} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {DisciplineColorIndicator} from '@/components/disciplinas/DisciplineColorIndicator';
import {getDisciplinaColor} from '@/components/disciplinas/disciplinaPalettes';
import {formatStudyMinutes} from '@/components/cronograma/PlanejamentoDisciplinas';
import {DIAS, diaAbrev} from '@/lib/cronograma/constants';
import {type Bloco, type Planejamento, type PlanejamentoResumo} from '@/lib/cronograma/types';
import {activityMinutes} from '@/lib/cronograma/activityPresentation';
import {cn} from '@/lib/utils';
import {studySurface, type StudyTone} from '@/lib/ui/studySurface';

export function CronogramaMetrics({plano, resumo}: {plano: Planejamento; resumo?: PlanejamentoResumo}) {
  const rows: {label:string; value:string; Icon:typeof Clock; tone:StudyTone}[] = [
    {label:'Horas planejadas na semana', value:resumo?formatStudyMinutes(resumo.minutos_planejados_semana):'—', Icon:Calendar, tone:'indigo'},
    {label:'Horas estudadas na semana', value:resumo?formatStudyMinutes(resumo.minutos_estudados_semana):'—', Icon:Clock, tone:'cyan'},
    {label:'Disciplinas cadastradas', value:String(plano.disciplinas.length), Icon:BookOpen, tone:'violet'},
    {label:'Progresso das atividades', value:resumo?`${resumo.progresso_pct.toFixed(0)}%`:'—', Icon:ListChecks, tone:'emerald'},
  ];
  return <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do cronograma">{rows.map(({label,value,Icon,tone})=><section key={label} className={`flex min-w-0 flex-col gap-2 rounded-xl border border-transparent p-4 ${studySurface(tone)}`}><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium leading-relaxed">{label}</p><Icon className="size-4 shrink-0" aria-hidden/></div><p className="text-2xl font-semibold tabular-nums">{value}</p>{tone==='emerald'&&resumo&&<Progress className="h-1.5 bg-current/10 [&_[data-slot=progress-indicator]]:bg-current" value={resumo.progresso_pct} aria-label={`${resumo.progresso_pct.toFixed(0)}% das atividades concluídas`}/>}</section>)}</div>;
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
      return <li key={d.disciplina_id} className={cn("min-w-0 space-y-2",few?"flex flex-wrap items-center gap-x-4 gap-y-2":"border-b border-border pb-3 last:border-0 last:pb-0")}><p className="flex min-w-0 flex-1 items-start gap-2 text-sm font-semibold leading-snug [overflow-wrap:anywhere]"><DisciplineColorIndicator disciplinaId={d.disciplina_id} shape="dot" className="mt-1"/>{d.nome}</p><p className="shrink-0 text-xs tabular-nums">{stats?`${formatStudyMinutes(studied)} / ${formatStudyMinutes(planned)}`:'Sem dados da semana'}<span className="ml-2 text-muted-foreground">{stats&&percent!=null?`${Math.round(percent)}%`:''}</span></p><div role={percent==null?undefined:'meter'} aria-label={`Execução de ${d.nome}`} aria-valuenow={percent==null?undefined:Math.min(100,percent)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={percent==null?'Sem carga planejada':`${Math.round(percent)}%`} className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${Math.max(0,Math.min(100,percent??0))}%`,backgroundColor:getDisciplinaColor(d.disciplina_id).color}}/></div></li>;
    })}</ul></section>
    <section className="min-w-0 rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Distribuição da carga semanal</h2><Button variant="ghost" size="sm" onClick={onViewAll}>Ver lista completa</Button></div>
      <p className="mt-1 text-xs text-muted-foreground">{loading?'Carregando atividades…':error?'Atividades indisponíveis':`${activities.length} atividades · ${formatStudyMinutes(total)} planejadas`}</p>
      {error?<Button variant="outline" className="mt-3" onClick={onRetry}>Tentar novamente</Button>:!loading&&<ul className={cn("mt-4 grid gap-3",few?"grid-cols-2 sm:grid-cols-4 xl:grid-cols-7":"sm:grid-cols-2")}>{daily.map(({day,count,minutes})=><li key={day} className="min-w-0 rounded-lg bg-muted/30 p-3"><div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium">{diaAbrev[day]}</span><span className="tabular-nums">{formatStudyMinutes(minutes)}</span></div><div role="meter" aria-label={`Carga de ${diaAbrev[day]}`} aria-valuenow={minutes} aria-valuemin={0} aria-valuemax={max} aria-valuetext={`${count} atividades, ${formatStudyMinutes(minutes)}`} className="my-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{width:`${minutes/max*100}%`}}/></div><p className="text-xs text-muted-foreground">{count? `${count} ${count===1?'atividade':'atividades'}`:'Sem atividades'}</p></li>)}</ul>}
      {!loading&&!error&&!activities.length&&<p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade nesta semana.</p>}
    </section>
  </div>;
}
