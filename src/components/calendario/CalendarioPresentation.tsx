import type { CSSProperties } from "react";
import { CalendarDays, CheckCircle2, CircleDashed, Clock3, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CalendarioDia, DiaStatus } from "@/lib/calendario/types";
import { STATUS_LABEL } from "@/lib/calendario/constants";
import { fmtDuracaoCalendario } from "@/lib/calendario/format";
import { getDisciplinaColor } from "@/components/disciplinas/disciplinaPalettes";
import { cn } from "@/lib/utils";
import "@/components/calendario/calendario.css";

export function CalendarioStatus({status,planejado=0,compact=false}:{status:DiaStatus;planejado?:number;compact?:boolean}) {
  const label=status==="futuro"?(planejado>0?"Planejado":"Sem plano"):STATUS_LABEL[status];
  const Icon=status==="cumprido"?CheckCircle2:status==="parcial"?Clock3:status==="estudou_sem_plano"?Sparkles:status==="futuro"&&planejado>0?CalendarDays:CircleDashed;
  return <span data-status={status} data-planned={planejado>0} className="calendar-status inline-flex min-w-0 items-center gap-1 text-xs font-medium"><Icon className="size-3.5 shrink-0" aria-hidden/><span className={compact?"calendar-month-status-label":undefined}>{label}</span></span>;
}
export function CalendarioStudyEvent({id,nome,minutos}:{id:string;nome:string;minutos:number}) {
  return <Tooltip><TooltipTrigger asChild><span className="calendar-study-event block min-w-0 rounded-md border-l-2 bg-card/90 px-2 py-1.5" style={{"--calendar-subject":getDisciplinaColor(id).color} as CSSProperties}>
    <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground [overflow-wrap:anywhere]">{nome}</span>
    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{fmtDuracaoCalendario(minutos)}</span>
  </span></TooltipTrigger><TooltipContent className="z-[10100] max-w-[min(22rem,calc(100vw-32px))] whitespace-normal leading-relaxed [overflow-wrap:anywhere]">{nome} · {fmtDuracaoCalendario(minutos)}</TooltipContent></Tooltip>;
}
type Summary={disciplinaId:string;nome:string;duracaoMinutos:number};
export function CalendarioDiaExpanded({dia,numero,today,onClick,disciplinas,agenda=false,data=dia?.data}:{dia:CalendarioDia|null;numero:number;today:boolean;onClick?:()=>void;disciplinas:Summary[];agenda?:boolean;data?:string}) {
  const status=dia?.status??"sem_planejamento",planned=dia?.minutos_planejados??0,real=dia?.minutos_realizados??0;
  const active=planned>0||real>0||(dia?.planejado.length??0)>0;
  const visible=disciplinas.slice(0,2),hidden=Math.max(0,disciplinas.length-visible.length);
  const Root=onClick?"button":"div";
  return <Root type={onClick?"button":undefined} onClick={onClick} data-calendar-date={data} data-status={status} data-planned={planned>0} aria-current={today?"date":undefined} aria-label={`${data??`Dia ${numero}`}, ${status==="futuro"&&planned>0?"Planejado":STATUS_LABEL[status]}, ${fmtDuracaoCalendario(planned)} planejados, ${fmtDuracaoCalendario(real)} realizados${disciplinas.map(d=>`, ${d.nome}`).join("")}`} className={cn("calendar-day flex min-w-0 flex-col gap-2 rounded-xl border p-2.5 text-left",agenda?"p-3":"min-h-24",onClick&&"cursor-pointer transition hover:ring-1 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",today&&"ring-2 ring-primary ring-offset-1 ring-offset-card")}>
    <span className="flex min-w-0 items-center justify-between gap-2">
      <span className="flex items-center gap-2"><span className={cn("inline-flex size-6 items-center justify-center rounded-md text-sm font-semibold tabular-nums",today?"bg-primary text-primary-foreground":"text-foreground")}>{numero}</span>{agenda&&data&&<span className="text-xs font-medium text-muted-foreground">{new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR",{weekday:"long"})}</span>}{today&&<span className="sr-only">Hoje</span>}</span>
      {active&&<CalendarioStatus status={status} planejado={planned} compact={!agenda}/>}
    </span>
    {visible.length>0&&<span className={cn("grid min-w-0 gap-1.5",agenda&&"sm:grid-cols-2")}>{visible.map(d=><CalendarioStudyEvent key={d.disciplinaId} id={d.disciplinaId} nome={d.nome} minutos={d.duracaoMinutos}/>)}</span>}
    {hidden>0&&<span className="text-xs font-medium text-primary">+{hidden} {hidden===1?"disciplina":"disciplinas"} · Ver estudos</span>}
    {active&&<span className="mt-auto flex flex-wrap gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">{planned>0&&<span>Plano: {fmtDuracaoCalendario(planned)}</span>}{real>0&&<span>Realizado: {fmtDuracaoCalendario(real)}</span>}</span>}
  </Root>;
}
