import {Link} from 'react-router-dom';
import {Clock3} from 'lucide-react';
import {CardTitle,CardDescription} from '@/components/ui/card';
import {DashboardCard,DashboardCardHeader,DashboardCardBody} from '@/components/dashboard/DashboardCard';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {studySurface, type StudyTone} from '@/lib/ui/studySurface';
import {DisciplineColorIndicator} from '@/components/disciplinas/DisciplineColorIndicator';
import {formatDashboardDuration as fmtMinutosEstudo} from '@/lib/dashboard/analysis';
import type {TodaySession} from '@/lib/dashboard/analysis';

const states={planejada:{label:'Planejada',variant:'outline'},em_andamento:{label:'Em andamento',variant:'info'},concluida:{label:'Concluída',variant:'success'},atrasada:{label:'Atrasada',variant:'destructive'}} as const;
const tones:Record<TodaySession['status'],StudyTone>={planejada:'indigo',em_andamento:'cyan',concluida:'emerald',atrasada:'amber'};
export function DashboardTodayPlan({items,onRegister,error=false,retry}:{items:TodaySession[];onRegister:(item:TodaySession)=>void;error?:boolean;retry?:()=>void}) {
 const completed=items.filter(i=>i.status==='concluida').length;
 return <DashboardCard><DashboardCardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Plano de hoje</CardTitle><Button asChild variant="ghost" size="sm"><Link to="/cronograma">Ver cronograma</Link></Button></div><CardDescription>{error?'Acompanhe suas atividades do dia':`${completed} de ${items.length} sessões concluídas`}</CardDescription>{!error&&items.length>0&&<Progress value={completed/items.length*100} aria-label={`${completed} de ${items.length} sessões concluídas`} className="mt-2 h-1.5"/>}</DashboardCardHeader><DashboardCardBody>
  {error?<div><p role="alert" className="text-sm text-muted-foreground">Plano do dia indisponível.</p><Button variant="outline" className="mt-2" onClick={retry}>Tentar novamente</Button></div>:items.length?<ul className="space-y-2 lg:max-h-60 lg:overflow-y-auto">{items.map(item=><li key={`${item.fonte}-${item.id}`} className={`rounded-lg p-3 ${studySurface(tones[item.status])}`}><div className="flex flex-wrap items-start justify-between gap-2"><p className="flex min-w-0 flex-1 items-start gap-2 text-sm font-semibold [overflow-wrap:anywhere]"><DisciplineColorIndicator disciplinaId={item.disciplina_id} shape="dot"/>{item.disciplina_nome}</p><Badge className="shrink-0 border-current/20 bg-transparent text-current" variant="outline">{states[item.status].label}</Badge></div>{item.topico_nome&&<p className="mt-1 break-words text-xs leading-relaxed">{item.topico_nome}</p>}<div className="mt-1 flex flex-wrap items-center justify-between gap-x-2"><span className="inline-flex items-center gap-1 text-xs"><Clock3 className="size-3.5" aria-hidden/>{item.hora_inicio?(item.hora_fim?`${item.hora_inicio}–${item.hora_fim}`:item.hora_inicio):'Sem horário'} · {fmtMinutosEstudo(item.duracao_minutos)}</span><Button variant="ghost" size="sm" className="min-h-10 px-1 text-current" onClick={()=>onRegister(item)}>Registrar estudo</Button></div></li>)}</ul>:<p className="text-sm text-muted-foreground">Nenhuma sessão planejada para hoje. <Link to="/cronograma" className="text-primary underline">Organizar cronograma</Link></p>}
 </DashboardCardBody></DashboardCard>;
}
