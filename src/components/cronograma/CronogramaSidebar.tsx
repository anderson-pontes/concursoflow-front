import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { WeeklyGoalCard } from "@/components/dashboard/DashboardPrimary";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { Button } from "@/components/ui/button";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import type { Bloco, Planejamento, PlanejamentoResumo } from "@/lib/cronograma/types";
import { getTipo } from "@/lib/cronograma/constants";
import { formatStudyMinutes } from "./PlanejamentoDisciplinas";
import { DisciplineColorIndicator, disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
import { getDisciplinaColor } from "@/components/disciplinas/disciplinaPalettes";

export function CronogramaSidebar({ plano, resumo, activities, disciplinaNome, onRegistro }: { plano: Planejamento; resumo?: PlanejamentoResumo; activities: Bloco[]; disciplinaNome: (id:string) => string; onRegistro: (bloco:Bloco) => void }) {
  const selected = usePomodoroStore(state => state.disciplinaId);
  const goal = useQuery({queryKey:["dashboard-resumo",plano.concurso_id],queryFn:async()=> (await api.get("/dashboard/resumo",{params:{concurso_id:plano.concurso_id}})).data as {meta_horas:number;horas_semana:number;questoes_semana:number}});
  return <aside className="min-w-0 space-y-4" aria-label="Acompanhamento do cronograma">
    <PomodoroTimer compact disciplinaNome={selected ? disciplinaNome(selected) : undefined} />
    <section className="rounded-xl border border-border bg-card p-4"><h2 className="text-base font-semibold">Resumo da semana</h2>{resumo ? <><p className="mt-4 text-2xl font-semibold tabular-nums">{formatStudyMinutes(resumo.minutos_estudados_semana)}</p><p className="text-sm text-muted-foreground">estudadas de {formatStudyMinutes(resumo.minutos_planejados_semana)} planejadas</p><p className="mt-4 text-sm">{resumo.atividades_concluidas} de {resumo.atividades_planejadas} atividades concluídas</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${Math.max(0,Math.min(100,resumo.progresso_pct))}%`}} /></div><p className="mt-2 text-xs text-muted-foreground">Conclusões registradas nos estudos reais.</p></> : <p className="mt-3 text-sm text-muted-foreground">Resumo indisponível.</p>}</section>
    <section className="rounded-xl border border-border bg-card p-4"><h2 className="text-base font-semibold">Disciplinas da semana</h2><ul className="mt-3 space-y-3">{plano.disciplinas.map(d => { const stats=resumo?.disciplinas.find(s=>s.disciplina_id===d.disciplina_id); const color=getDisciplinaColor(d.disciplina_id); const planned=stats?.minutos_planejados ?? 0; const studied=stats?.minutos_estudados ?? 0; const pct=planned > 0 ? Math.min(100, studied / planned * 100) : 0; return <li key={d.disciplina_id} className="min-w-0 space-y-1.5 rounded-lg border border-border/70 p-2" style={disciplineColorStyle(d.disciplina_id)}><div className="flex min-w-0 items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 break-words font-medium"><DisciplineColorIndicator disciplinaId={d.disciplina_id} shape="dot" />{d.nome}</span><span className="shrink-0 tabular-nums text-muted-foreground">{stats ? formatStudyMinutes(studied) : "—"}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:color.color}} /></div><p className="text-[11px] text-muted-foreground">{stats ? `${formatStudyMinutes(studied)} de ${formatStudyMinutes(planned)} planejados` : "Sem dados da semana"}</p></li>;})}</ul></section>
    <section className="rounded-xl border border-border bg-card p-4"><h2 className="text-base font-semibold">Atividades da semana</h2><ul className="mt-2 divide-y divide-border">{activities.slice(0,4).map(b => <li key={`${b.id}-${b.data}`} className="py-3"><p className="break-words text-sm font-medium">{disciplinaNome(b.disciplina_id)}</p><p className="mt-1 text-xs text-muted-foreground">{b.data?.split("-").reverse().join("/")} · {b.hora_inicio?.slice(0,5) || "Sem horário"} · {getTipo(b.tipo).label}</p><Button variant="link" className="mt-1 h-10 px-0" onClick={()=>onRegistro(b)}>Registrar estudo</Button></li>)}</ul>{!activities.length && <p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade nesta semana.</p>}</section>
    <Button asChild variant="outline" className="w-full"><Link to="/pomodoro">Configurar Pomodoro</Link></Button>
    {goal.data || goal.isError ? <div><p className="mb-2 text-sm font-medium">Meta da semana atual</p><WeeklyGoalCard hours={goal.data?.horas_semana ?? 0} goalHours={(goal.data?.meta_horas ?? 0)*7} questions={goal.data?.questoes_semana ?? 0} isError={goal.isError} onRetry={()=>void goal.refetch()} /></div> : null}
  </aside>;
}
