import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { DisciplineColorIndicator } from "./DisciplineColorIndicator";

import "./disciplineVisual.css";
export type StudyState = "new" | "studying" | "completed";
export function disciplineStudyState(total: number, completed: number, started = completed): StudyState {
  return total > 0 && completed >= total ? "completed" : started > 0 ? "studying" : "new";
}
export function DisciplineStatus({state}:{state:StudyState}) {
  return <span data-study-state={state} className="discipline-status">{state === "completed" ? "Concluída" : state === "studying" ? "Em andamento" : "Não iniciada"}</span>;
}
export function DisciplineIdentity({id,name,context,state="new"}:{id:string;name:string;context?:ReactNode;state?:StudyState}) {
  return <div className="flex min-w-0 items-start gap-3" data-study-state={state}>
    <span className="discipline-icon relative flex size-10 shrink-0 items-center justify-center rounded-lg"><BookOpen className="size-5" aria-hidden/><DisciplineColorIndicator disciplinaId={id} shape="dot" className="absolute bottom-1 right-1"/></span>
    <div className="min-w-0 flex-1"><Link to={`/disciplinas/${id}`} className="block text-sm font-semibold leading-relaxed text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]">{name}</Link>{context&&<div className="mt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{context}</div>}</div>
  </div>;
}
export function DisciplineProgress({value,label="Progresso da disciplina",state="new",description}:{value:number|null;label?:string;state?:StudyState;description?:ReactNode}) {
  const clamped=value==null?0:Math.max(0,Math.min(100,value));
  return <div data-study-state={state} data-progress-empty={value===0} className="discipline-progress-block min-w-0"><div className="mb-2 flex items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{label}</span><strong className="discipline-progress-value tabular-nums">{value==null?"—":`${Math.round(value)}%`}</strong></div><div role={value==null?undefined:"meter"} aria-label={label} aria-valuenow={value==null?undefined:clamped} aria-valuemin={0} aria-valuemax={100} aria-valuetext={value==null?"Sem dados":`${Math.round(value)}%`} className="h-2 overflow-hidden rounded-full bg-muted"><div className="discipline-progress-fill h-full rounded-full" style={{width:`${clamped}%`}}/></div>{description&&<p className="mt-2 text-xs text-muted-foreground">{description}</p>}</div>;
}
export function DisciplineSummary({id,name,state,context,value,label,description}:{id:string;name:string;state:StudyState;context?:ReactNode;value:number|null;label?:string;description?:ReactNode}) {
  return <div data-study-state={state} className="discipline-summary space-y-3 rounded-xl border p-3"><DisciplineIdentity id={id} name={name} state={state} context={context}/><DisciplineProgress value={value} state={state} label={label} description={description}/></div>;
}
