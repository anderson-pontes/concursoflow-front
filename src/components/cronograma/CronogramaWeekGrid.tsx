import {useState} from 'react';
import {Plus} from 'lucide-react';
import {CronogramaBlocoCard} from '@/components/cronograma/CronogramaBlocoCard';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {activityMinutes} from '@/lib/cronograma/activityPresentation';
import {formatStudyMinutes} from '@/components/cronograma/PlanejamentoDisciplinas';
import {DIAS, diaAbrev, diaLabels} from '@/lib/cronograma/constants';
import {hojeISO, fmtDateBR, type Bloco} from '@/lib/cronograma/types';
import {cn} from '@/lib/utils';

type Props = {
  isLoading: boolean; totalBlocos: number; diaHoje: Bloco['dia_semana'];
  grouped: Record<Bloco['dia_semana'], Bloco[]>; disciplinaNome: (id: string) => string;
  deletePending: boolean; extendPending: boolean;
  onEdit: (bloco: Bloco) => void; onRemove: (bloco: Bloco, diaLabel: string) => void; onExtend: (bloco: Bloco) => void;
  onAdd?: (day: Bloco['dia_semana']) => void; onDuplicate?: (bloco: Bloco) => void; onRegistro?: (bloco: Bloco) => void;
  occurrenceDate?: (day: Bloco['dia_semana']) => string;
};

export function CronogramaWeekGrid({isLoading, totalBlocos, diaHoje, grouped, disciplinaNome, deletePending, extendPending, onEdit, onRemove, onExtend, onAdd, onDuplicate, onRegistro, occurrenceDate}: Props) {
  const [selected, setSelected] = useState<Bloco['dia_semana'] | null>(null);
  if (isLoading) return <div className="grid gap-3 sm:grid-cols-2" aria-label="Carregando agenda">{DIAS.slice(0,4).map(day=><Skeleton key={day} className="h-40 rounded-xl"/>)}</div>;
  if (!totalBlocos && !onAdd) return null;
  const days = selected ? [selected] : DIAS.filter(day=>grouped[day]?.length);
  return <section className="min-w-0 space-y-4" aria-label="Agenda semanal">
    <div className="grid grid-cols-7 gap-1 sm:gap-2" role="group" aria-label="Selecionar dia da semana">
      {DIAS.map(day=>{
        const today = occurrenceDate ? occurrenceDate(day)===hojeISO() : day===diaHoje;
        const count = grouped[day]?.length ?? 0;
        const minutes=(grouped[day]??[]).reduce((sum,b)=>sum+activityMinutes(b),0);
        const compactTime=minutes<60?`${minutes}m`:formatStudyMinutes(minutes).replace("min","");
        return <button key={day} type="button" aria-pressed={selected===day} aria-current={today?'date':undefined} aria-label={`${diaLabels[day]}, ${count} atividades, ${formatStudyMinutes(minutes)}${today?', hoje':''}`} onClick={()=>setSelected(day)} className={cn('flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-xs transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selected===day?'border-primary bg-primary text-primary-foreground ring-2 ring-primary/25':today?'border-primary/30 bg-primary/10 text-primary':'border-border bg-card text-foreground', selected!==day&&!today&&!count&&'border-dashed bg-muted/30 text-muted-foreground')}>
          <span className="font-medium">{today?"Hoje":diaAbrev[day]}</span><span className="text-base font-semibold tabular-nums">{occurrenceDate?.(day)?.slice(8,10) ?? '·'}</span><span className="whitespace-nowrap text-[10px] tabular-nums opacity-80">{count}<span className="hidden md:inline"> ativ.</span>·{compactTime}</span>
        </button>;
      })}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{selected?diaLabels[selected]:'Agenda da semana'}</h3><Button size="sm" variant="ghost" aria-pressed={!selected} onClick={()=>setSelected(null)}>Mostrar todos os dias</Button></div>
    {!days.length && <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhuma atividade nesta semana. Selecione um dia para adicionar.</p>}
    {days.map(day=>{
      const items=[...(grouped[day]??[])].sort((a,b)=>(a.hora_inicio||'99:99').localeCompare(b.hora_inicio||'99:99'));
      return <section key={day} className="min-w-0 space-y-3" aria-label={`Atividades de ${diaLabels[day]}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"><p className="text-sm font-medium">{diaLabels[day]}{occurrenceDate&&<span className="ml-2 text-xs font-normal text-muted-foreground">{fmtDateBR(occurrenceDate(day))}</span>}</p>{onAdd&&<Button variant="ghost" size="sm" aria-label={`Adicionar atividade ${diaAbrev[day]}`} onClick={()=>onAdd(day)}><Plus className="size-4" aria-hidden/>Adicionar</Button>}</div>
        <div className="grid items-stretch gap-3 md:grid-cols-2">{items.map(bloco=><CronogramaBlocoCard key={`${bloco.id}-${bloco.data??''}`} bloco={bloco} disciplinaNome={disciplinaNome(bloco.disciplina_id)} diaLabel={diaAbrev[day]} occurrenceDate={bloco.data??occurrenceDate?.(day)} onEdit={()=>onEdit(bloco)} onDelete={()=>onRemove(bloco,diaAbrev[day])} onDuplicate={onDuplicate?()=>onDuplicate(bloco):undefined} onRegistro={onRegistro?()=>onRegistro(bloco):undefined} onEstender={bloco.grupo_id?()=>onExtend(bloco):undefined} deletePending={deletePending} estenderPending={extendPending}/>)}</div>
        {!items.length&&<p className="py-2 text-sm text-muted-foreground">Sem atividades neste dia.</p>}
      </section>;
    })}
  </section>;
}
