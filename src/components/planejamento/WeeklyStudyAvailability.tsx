import React from "react";
import { Clock3, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { durationInput, durationLabel, parseDuration, WEEK_DAYS, WEEK_DAY_NAMES } from "@/lib/planejamento/availability";
import "@/components/planejamento/study-plan.css";

const PRESETS = [30, 60, 90, 120, 150, 180, 240];
function DurationPicker({value, onChange, label, onValidityChange}: {value: number; onChange: (n:number)=>void; label:string; onValidityChange:(valid:boolean)=>void}) {
  const [custom, setCustom] = React.useState(!PRESETS.includes(value) && value !== 0);
  const [raw, setRaw] = React.useState(durationInput(value));
  const parsed = parseDuration(raw);
  const customMode = custom || (value !== 0 && !PRESETS.includes(value));
  const error = customMode && parsed === null;
  const id = React.useId();
  React.useEffect(() => { setRaw(previous => parseDuration(previous) === value ? previous : durationInput(value)); }, [value]);
  React.useEffect(() => { onValidityChange(!error); }, [error, onValidityChange]);
  return <div className="min-w-0 space-y-2">
    <SelectField aria-label={`Duração de ${label}`} className="min-h-11 w-full" value={customMode ? "custom" : String(value)} onValueChange={next => {
      if (next === "custom") { setCustom(true); setRaw(durationInput(value)); }
      else {setCustom(false); onChange(Number(next));}
    }} options={[{value:"0", label:"Descanso"}, ...PRESETS.map(n=>({value:String(n),label:durationLabel(n)})), {value:"custom",label:"Personalizar duração"}]} />
    {customMode && <><Input aria-label={`Duração personalizada de ${label}`} aria-invalid={error} aria-describedby={`${id}-hint`} value={raw} placeholder="02:30" inputMode="text" className="min-h-11" onChange={e=>{setRaw(e.target.value); const next=parseDuration(e.target.value); if(next!==null)onChange(next);}} />
      <p id={`${id}-hint`} className={cn("text-xs",error?"text-destructive":"text-muted-foreground")}>{error ? "Use HH:mm, de 00:00 a 24:00." : "Duração em horas e minutos, não horário do dia."}</p></>}
  </div>;
}

export function WeeklyStudyAvailability({value, onChange, onValidityChange, remembered}: {
  value:Record<number,number>; onChange:(next:Record<number,number>)=>void; onValidityChange:(valid:boolean)=>void; remembered?:React.MutableRefObject<Record<number,number>>;
}) {
  const localMemory = React.useRef<Record<number,number>>({});
  const memory = remembered ?? localMemory;
  const [quick, setQuick] = React.useState(120);
  const [resetKeys, setResetKeys] = React.useState<Record<number,number>>({});
  const [targetsOpen, setTargetsOpen] = React.useState(false);
  const targetsId = React.useId();
  const targetsTrigger = React.useRef<HTMLButtonElement>(null);
  const [targets, setTargets] = React.useState<number[]>([]);
  const [invalid, setInvalid] = React.useState<Record<string,boolean>>({});
  const setValidity = React.useCallback((key:string, valid:boolean)=>setInvalid(old=>old[key]===!valid?old:{...old,[key]:!valid}),[]);
  React.useEffect(()=>{onValidityChange(!Object.entries(invalid).some(([key,error])=>key!=="quick"&&error));},[invalid,onValidityChange]);
  const callbacks=React.useMemo(()=>Array.from({length:7},(_,i)=>(valid:boolean)=>setValidity(String(i),valid)),[setValidity]);
  const quickValidity=React.useCallback((valid:boolean)=>setValidity("quick",valid),[setValidity]);
  const minutes = WEEK_DAYS.map((_, i)=>value[i]??0), total=minutes.reduce((a,b)=>a+b,0), active=minutes.filter(n=>n>0).length;
  const resetDays = (days:number[]) => {
    setResetKeys(old=>({...old,...Object.fromEntries(days.map(i=>[i,(old[i]??0)+1]))}));
    setInvalid(old=>({...old,...Object.fromEntries(days.map(i=>[i,false]))}));
  };
  const update=(i:number, n:number)=>{
    if(n>0) memory.current[i]=n;
    else {if(value[i]>0)memory.current[i]=value[i];setValidity(String(i),true);}
    onChange({...value,[i]:n});
  };
  const apply=(days:number[])=>{
    const next={...value};
    days.forEach(i=>{if(next[i]>0)memory.current[i]=next[i];next[i]=quick;if(quick>0)memory.current[i]=quick;});
    onChange(next);resetDays(days);
  };
  return <section aria-labelledby="weekly-availability-title" className="weekly-availability min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="weekly-availability-title" className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5 text-primary" aria-hidden />Disponibilidade semanal</h3><p className="mt-1 text-sm text-muted-foreground">Selecione os dias e quanto tempo poderá estudar.</p></div><div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-right" role="status"><p className="text-xs text-muted-foreground">Total semanal</p><strong className="text-xl text-primary">{durationLabel(total)}</strong></div></div>
    <div className="availability-days">{WEEK_DAYS.map((day,i)=><div key={day} className={cn("availability-day min-w-0 rounded-xl border p-3",minutes[i]>0?"border-primary/40 bg-primary/5":"border-border bg-muted/20")}>
      <label className="flex min-h-11 min-w-0 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
        <span className="min-w-0">{WEEK_DAY_NAMES[i]}</span>
        <Checkbox aria-label={`Estudar na ${WEEK_DAY_NAMES[i]}`} checked={minutes[i]>0} onCheckedChange={checked=>update(i,checked?memory.current[i]??60:0)} />
      </label>
      {minutes[i]>0 ? <DurationPicker key={`${i}-${resetKeys[i]??0}`} label={WEEK_DAY_NAMES[i]} value={minutes[i]} onChange={n=>update(i,n)} onValidityChange={callbacks[i]} /> : <span className="flex min-h-11 items-center text-sm text-muted-foreground">Descanso</span>}
    </div>)}</div>
    <div className="space-y-3 border-t border-border pt-3"><h4 className="text-sm font-semibold">Preenchimento rápido</h4>
      <div className="flex flex-wrap items-start gap-2">
        <div className="w-full min-w-0 sm:w-48"><DurationPicker label="preenchimento rápido" value={quick} onChange={setQuick} onValidityChange={quickValidity}/></div>
        <Button type="button" variant="outline" className="min-h-11" disabled={invalid.quick} onClick={()=>apply([0,1,2,3,4])}>Aplicar de seg. a sex.</Button>
        <Button type="button" variant="outline" className="min-h-11" disabled={invalid.quick} onClick={()=>apply([0,1,2,3,4,5,6])}>Aplicar todos os dias</Button>
        <Button ref={targetsTrigger} type="button" variant="outline" className="min-h-11" aria-expanded={targetsOpen} aria-controls={targetsId} onClick={()=>setTargetsOpen(open=>!open)}>Copiar para dias selecionados</Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={()=>{minutes.forEach((n,i)=>{if(n>0)memory.current[i]=n;});onChange(Object.fromEntries(WEEK_DAYS.map((_,i)=>[i,0])));resetDays([0,1,2,3,4,5,6]);}}>Limpar semana</Button>
      </div>
      {targetsOpen&&<div id={targetsId} role="region" aria-label="Dias de destino da cópia" className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-sm font-medium">Selecione quais dias receberão {durationLabel(quick)}.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{WEEK_DAYS.map((day,i)=><label key={day} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={targets.includes(i)} onCheckedChange={checked=>setTargets(old=>checked?[...old,i]:old.filter(n=>n!==i))} aria-label={`Copiar para ${WEEK_DAY_NAMES[i]}`} />{day}</label>)}</div>
        <div className="flex flex-wrap items-center gap-3"><Button type="button" disabled={!targets.length||invalid.quick} onClick={()=>{apply(targets);setTargetsOpen(false);targetsTrigger.current?.focus();}}>Aplicar aos dias selecionados</Button><p className="text-xs text-muted-foreground">Somente os dias marcados serão alterados.</p></div>
      </div>}
    </div>
    <div className="space-y-3 border-t border-border pt-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="flex items-center gap-2 font-medium"><Clock3 className="size-4 text-primary" aria-hidden />Distribuição semanal</span><span className="text-muted-foreground">{active} dias de estudo · média {durationLabel(active?total/active:0)} por dia ativo</span></div><div className="flex h-4 overflow-hidden rounded-full bg-muted" role="img" aria-label={minutes.map((n,i)=>`${WEEK_DAYS[i]}: ${durationLabel(n)}`).join('; ')}>{minutes.map((n,i)=>n>0&&<span key={i} className={`availability-segment availability-segment-${i}`} style={{width:`${n/total*100}%`}} title={`${WEEK_DAY_NAMES[i]}: ${durationLabel(n)} (${Math.round(n/total*100)}%)`} />)}</div><p className="text-xs text-muted-foreground">Dias em descanso não entram no planejamento. A média é arredondada para minutos.</p></div>
  </section>;
}
