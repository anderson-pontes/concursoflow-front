import { Pencil, Plus } from "lucide-react";
import { layoutDay } from "./temporalLayout";
import { getTipo, getTipoSurface } from "@/lib/cronograma/constants";

import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DIAS, diaAbrev } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { hojeISO } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { DisciplineColorIndicator, disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";

type Props = {
  isLoading: boolean;
  totalBlocos: number;
  diaHoje: Bloco["dia_semana"];
  grouped: Record<Bloco["dia_semana"], Bloco[]>;
  disciplinaNome: (id: string) => string;
  deletePending: boolean;
  extendPending: boolean;
  onEdit: (bloco: Bloco) => void;
  onRemove: (bloco: Bloco, diaLabel: string) => void;
  onExtend: (bloco: Bloco) => void;
  onAdd?: (day: Bloco["dia_semana"]) => void;
  onDuplicate?: (bloco: Bloco) => void;
  onRegistro?: (bloco: Bloco) => void;
  occurrenceDate?: (day: Bloco["dia_semana"]) => string;
};

export function CronogramaWeekGrid({ isLoading, totalBlocos, diaHoje, grouped, disciplinaNome, deletePending, extendPending, onEdit, onRemove, onExtend, onAdd, onDuplicate, onRegistro, occurrenceDate }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-4 xl:grid-cols-7 xl:gap-3">
        {DIAS.map((dia) => <Skeleton key={dia} className="h-40 rounded-xl" />)}
      </div>
    );
  }
  if (totalBlocos === 0 && !onAdd) return null;

  const layouts = DIAS.map(day => {
    const layout = layoutDay(grouped[day] ?? []);
    // A narrow day column cannot safely show several simultaneous titles.
    // Keep those occurrences in the detailed agenda with all their actions.
    const dense = layout.lanes > 1;
    const detailed = layout.timed.filter(event => dense || disciplinaNome(event.bloco.disciplina_id).length > 32);
    return { ...layout, timed: layout.timed.filter(event => !detailed.includes(event)), agenda: [...layout.agenda, ...detailed.map(event => event.bloco)] };
  });
  const events = layouts.flatMap(day => day.timed);
  const firstHour = Math.min(7, ...events.map(event => Math.floor(event.start / 60)));
  const lastHour = Math.max(20, ...events.map(event => Math.ceil(event.end / 60)));
  const scale = 80;
  return (
    <>
    <section className="hidden min-w-0 rounded-xl border border-border bg-card xl:block" aria-label="Calendário semanal por horário">
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-border">
        <span className="p-2 text-xs text-muted-foreground">Hora</span>
        {DIAS.map(day => <div key={day} className={cn("min-w-0 border-l border-border p-2 text-center text-xs", (occurrenceDate ? occurrenceDate(day) === hojeISO() : day === diaHoje) && "bg-primary/5")}><p className="font-semibold">{diaAbrev[day]}</p><p className="text-muted-foreground">{occurrenceDate?.(day)?.slice(5).split("-").reverse().join("/")}</p>{onAdd && <button className="mt-1 inline-flex min-h-10 items-center gap-1 text-primary" aria-label={`Adicionar atividade ${diaAbrev[day]}`} onClick={() => onAdd(day)}><Plus className="size-4" /><span>Adicionar</span></button>}</div>)}
      </div>
      {events.length > 0 ? <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]">
        <div className="relative" style={{ height: (lastHour - firstHour) * scale }}>{Array.from({length:lastHour-firstHour}, (_, index) => <span key={index} className="absolute left-1 text-xs tabular-nums text-muted-foreground" style={{top:index*scale}}>{String(firstHour+index).padStart(2,"0")}:00</span>)}</div>
        {DIAS.map((day,index) => <div key={day} className="relative min-w-0 border-l border-border" style={{height:(lastHour-firstHour)*scale}}>
          {Array.from({length:lastHour-firstHour},(_,hour) => <div key={hour} className="absolute inset-x-0 border-t border-border/60" style={{top:hour*scale}} />)}
          {layouts[index].timed.map(({bloco,start,end,lane}) => <button key={`${bloco.id}-${bloco.data}`} className={cn("absolute overflow-hidden rounded-lg border border-border border-l-4 p-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",getTipoSurface(bloco.tipo))} style={{...disciplineColorStyle(bloco.disciplina_id),top:(start-firstHour*60)/60*scale,height:(end-start)/60*scale-4,left:`${lane/layouts[index].lanes*100}%`,width:`${100/layouts[index].lanes}%`}} onClick={() => onRegistro ? onRegistro(bloco) : onEdit(bloco)} title={`${disciplinaNome(bloco.disciplina_id)} · ${bloco.hora_inicio}–${bloco.hora_fim} · ${getTipo(bloco.tipo).label}`}>
            <span className="mb-1 flex items-center gap-1"><DisciplineColorIndicator disciplinaId={bloco.disciplina_id} shape="dot" label={`Cor de ${disciplinaNome(bloco.disciplina_id)}`} /><span className="block line-clamp-2 break-words text-xs font-semibold">{disciplinaNome(bloco.disciplina_id)}</span></span><span className="block text-xs tabular-nums">{bloco.hora_inicio.slice(0,5)}–{bloco.hora_fim.slice(0,5)}</span><span className="block truncate text-xs text-muted-foreground">{getTipo(bloco.tipo).label} · Planejado</span>
          </button>)}
        </div>)}
      </div> : null}
      {layouts.some(day => day.agenda.length > 0) && <div className="border-t border-border p-4"><h3 className="mb-3 text-sm font-semibold">Agenda detalhada</h3><div className="grid gap-3 md:grid-cols-2">{layouts.flatMap(day => day.agenda).map(bloco => <CronogramaBlocoCard key={`${bloco.id}-${bloco.data}`} bloco={bloco} disciplinaNome={disciplinaNome(bloco.disciplina_id)} diaLabel={diaAbrev[bloco.dia_semana]} occurrenceDate={bloco.data ?? occurrenceDate?.(bloco.dia_semana)} onEdit={() => onEdit(bloco)} onDelete={() => onRemove(bloco,diaAbrev[bloco.dia_semana])} onRegistro={onRegistro ? () => onRegistro(bloco) : undefined} onDuplicate={onDuplicate ? () => onDuplicate(bloco) : undefined} />)}</div></div>}
    </section>
    <div className="grid grid-cols-1 gap-3 pb-1 md:grid-cols-2 xl:hidden" role="list" aria-label="Dias da semana">
      {DIAS.map((dia) => {
        const isHoje = occurrenceDate ? occurrenceDate(dia) === hojeISO() : dia === diaHoje;
        const items = grouped[dia] ?? [];
        return (
          <div key={dia} role="listitem" className={cn("min-w-0 rounded-xl border p-2.5 sm:p-3", isHoje ? "border-primary-400 bg-primary-50/60 shadow-sm dark:border-primary-600 dark:bg-primary-950/30" : "border-border bg-card") }>
            <div className="mb-2 flex items-center justify-between gap-1">
              <span className={cn("flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-wide", isHoje ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground") }>
                <span>{diaAbrev[dia]}</span>
                {isHoje ? <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold normal-case text-primary-foreground">hoje</span> : null}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {items.length === 1 ? (
                  <button type="button" title={`Editar ${diaAbrev[dia]}`} aria-label={`Editar bloco de ${diaAbrev[dia]}`} onClick={() => onEdit(items[0])} className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
                {items.length > 0 ? <span className="rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">{items.length}</span> : null}
              </div>
            </div>
            <div className="space-y-2">
              {onAdd && <button type="button" aria-label={`Adicionar atividade ${diaAbrev[dia]}`} onClick={() => onAdd(dia)} className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-primary hover:bg-muted"><Plus className="size-4" />Adicionar atividade</button>}
              {items.map((bloco) => (
                <CronogramaBlocoCard key={`${bloco.id}-${bloco.data ?? ""}`} bloco={bloco} disciplinaNome={disciplinaNome(bloco.disciplina_id)} diaLabel={diaAbrev[dia]} onEdit={() => onEdit(bloco)} onDelete={() => onRemove(bloco, diaAbrev[dia])} occurrenceDate={bloco.data ?? occurrenceDate?.(dia)} onDuplicate={onDuplicate ? () => onDuplicate(bloco) : undefined} onRegistro={onRegistro ? () => onRegistro(bloco) : undefined} deletePending={deletePending} estenderPending={extendPending} onEstender={bloco.grupo_id ? () => onExtend(bloco) : undefined} />
              ))}
              {items.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Sem blocos</p> : null}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
