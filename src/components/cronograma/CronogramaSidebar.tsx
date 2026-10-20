import {useQuery} from '@tanstack/react-query';
import {api} from '@/services/api';
import {PomodoroTimer} from '@/components/pomodoro/PomodoroTimer';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {usePomodoroStore} from '@/stores/pomodoroStore';
import type {Planejamento, PlanejamentoResumo} from '@/lib/cronograma/types';
import {MetricCard} from "@/components/ui/metric-card";
import {Calendar, Clock} from "lucide-react";
import {formatStudyMinutes} from '@/components/cronograma/PlanejamentoDisciplinas';

export function CronogramaSidebar({plano,resumo,disciplinaNome}: {plano:Planejamento; resumo?:PlanejamentoResumo; disciplinaNome:(id:string)=>string}) {
  const selected=usePomodoroStore(state=>state.disciplinaId);
  const goal=useQuery({queryKey:['dashboard-resumo',plano.concurso_id],queryFn:async()=>(await api.get('/dashboard/resumo',{params:{concurso_id:plano.concurso_id}})).data as {meta_horas:number;horas_semana:number;questoes_semana:number}});
  const execution=resumo&&resumo.minutos_planejados_semana>0?resumo.minutos_estudados_semana/resumo.minutos_planejados_semana*100:null;
  return <aside className="grid min-w-0 content-start gap-4 md:grid-cols-2 min-[1440px]:grid-cols-1" aria-label="Acompanhamento do cronograma">
    <div className="min-w-0"><PomodoroTimer compact configureUrl="/pomodoro" disciplinaNome={selected?disciplinaNome(selected):undefined}/></div>
    <section className="min-w-0 self-start rounded-xl border border-border bg-card p-4"><h2 className="text-base font-semibold">Resumo da semana</h2>{resumo?<><div className="mt-3 grid grid-cols-2 gap-2"><MetricCard label="Planejadas" value={formatStudyMinutes(resumo.minutos_planejados_semana)} icon={Calendar} tone="indigo" className="p-2.5 sm:p-3"/><MetricCard label="Realizadas" value={formatStudyMinutes(resumo.minutos_estudados_semana)} icon={Clock} tone="green" className="p-2.5 sm:p-3"/></div><Progress className="mt-3 h-2" value={Math.max(0,Math.min(100,execution??0))} aria-label={execution==null?'Sem tempo planejado':`Execução da carga horária: ${Math.round(execution)}%`}/><p className="mt-2 text-xs text-muted-foreground">{execution==null?'Sem tempo planejado':`Execução da carga horária: ${Math.round(execution)}%`}</p><p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed">Atividades concluídas: {resumo.atividades_concluidas} de {resumo.atividades_planejadas} ({resumo.progresso_pct.toFixed(0)}%)</p></>:<p className="mt-3 text-sm text-muted-foreground">Resumo indisponível.</p>}
      <details className="mt-3 border-t border-border pt-3 text-xs"><summary className="cursor-pointer py-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Meta da semana atual</summary>{goal.isError?<><p className="mt-2 text-muted-foreground">Meta indisponível.</p><Button size="sm" variant="ghost" onClick={()=>void goal.refetch()}>Tentar novamente</Button></>:goal.data?<p className="mt-2 leading-relaxed text-muted-foreground">{formatStudyMinutes(goal.data.horas_semana*60)} de {formatStudyMinutes(goal.data.meta_horas*7*60)} · {goal.data.questoes_semana??0} questões</p>:<p className="mt-2 text-muted-foreground">Carregando meta…</p>}</details>
    </section>
  </aside>;
}
