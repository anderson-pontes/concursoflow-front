import type { MutableRefObject } from "react";
import { BookOpen, CalendarClock, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { WeeklyStudyAvailability } from "@/components/planejamento/WeeklyStudyAvailability";
import type { ConfigPlanejamento, DisciplinaPlanoInput, NivelConhecimento } from "@/types/planejamento";

const KNOWLEDGE: {value:NivelConhecimento;label:string}[] = [
  {value:"muito_fraco",label:"Muito fraco"},{value:"fraco",label:"Fraco"},{value:"regular",label:"Regular"},{value:"bom",label:"Bom"},{value:"muito_bom",label:"Muito bom"},
];
function Field({label,children}:{label:string;children:React.ReactNode}) {return <label className="block min-w-0 text-sm font-medium"><span className="mb-2 block">{label}</span>{children}</label>;}
export function StudyPlanPlanningStep({config,onConfigChange,disciplines,onDisciplineChange,onAvailabilityValidityChange,remembered,errors,warnings}:{
  config:ConfigPlanejamento;onConfigChange:(config:ConfigPlanejamento)=>void;disciplines:DisciplinaPlanoInput[];onDisciplineChange:(index:number,patch:Partial<DisciplinaPlanoInput>)=>void;
  onAvailabilityValidityChange:(valid:boolean)=>void;remembered:MutableRefObject<Record<number,number>>;errors:string[];warnings:string[];
}) {
  return <div className="mt-4 min-w-0 space-y-4">
    <section aria-labelledby="plan-priorities-title" className="min-w-0 space-y-3">
      <div><h3 id="plan-priorities-title" className="flex items-center gap-2 font-semibold"><BookOpen className="size-5 text-primary" aria-hidden />Prioridades das disciplinas</h3><p className="mt-1 text-sm text-muted-foreground">A prioridade considera peso × dificuldade. Quanto menor seu domínio, maior a frequência sugerida.</p></div>
      <div className="divide-y divide-border rounded-xl border border-border">{disciplines.map((d,index)=>d.ativa&&<div key={d.disciplina_id??`${d.nome}-${index}`} className="discipline-priority-row min-w-0 px-3 py-2">
        <strong className="discipline-priority-name min-w-0 text-sm leading-relaxed [overflow-wrap:anywhere]">{d.nome}</strong>
        <div><div className="mb-1 flex min-h-6 items-center gap-1"><label htmlFor={`plan-weight-${index}`} className="text-xs font-medium">Peso (1–10)</label><TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label={`Sobre o peso de ${d.nome}`}><Info className="size-3.5" aria-hidden /></Button></TooltipTrigger><TooltipContent>Maior peso aumenta a prioridade, junto ao seu nível de conhecimento.</TooltipContent></Tooltip></TooltipProvider></div><Input id={`plan-weight-${index}`} type="number" min={1} max={10} value={Number.isFinite(d.peso)?d.peso:""} aria-invalid={!Number.isInteger(d.peso)||d.peso<1||d.peso>10} onChange={e=>onDisciplineChange(index,{peso:Number(e.target.value)})} className="min-h-11" /></div>
        <Field label="Seu conhecimento"><SelectField aria-label={`Conhecimento de ${d.nome}`} value={d.conhecimento} onValueChange={value=>onDisciplineChange(index,{conhecimento:value as NivelConhecimento})} options={KNOWLEDGE} className="min-h-11" /></Field>
      </div>)}</div>
    </section>
    <section aria-labelledby="plan-parameters-title" className="space-y-3 border-t border-border pt-4">
      <div><h3 id="plan-parameters-title" className="flex items-center gap-2 font-semibold"><CalendarClock className="size-5 text-primary" aria-hidden />Parâmetros do plano</h3><p className="mt-1 text-sm text-muted-foreground">Defina o período e os limites de cada sessão.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Formato"><SelectField value={config.tipo} onValueChange={value=>onConfigChange({...config,tipo:value as ConfigPlanejamento['tipo']})} options={[{value:"ciclo",label:"Ciclo de estudos"},{value:"semanal",label:"Grade semanal"}]} className="min-h-11" /></Field>
        <Field label="Data de início"><DatePicker value={config.data_inicio} onValueChange={value=>onConfigChange({...config,data_inicio:value})} /></Field>
        <Field label="Planejar até"><DatePicker value={config.data_fim} onValueChange={value=>onConfigChange({...config,data_fim:value})} /></Field>
      </div>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <Field label="Sessão mínima (min)"><Input type="number" min={5} max={240} value={config.sessao_min_minutos} onChange={e=>onConfigChange({...config,sessao_min_minutos:Number(e.target.value)})} className="min-h-11" /></Field>
        <Field label="Sessão máxima (min)"><Input type="number" min={5} max={240} value={config.sessao_max_minutos} onChange={e=>onConfigChange({...config,sessao_max_minutos:Number(e.target.value)})} className="min-h-11" /></Field>
      </div>
    </section>
    <WeeklyStudyAvailability value={config.disponibilidade_minutos} onChange={value=>onConfigChange({...config,disponibilidade_minutos:value})} onValidityChange={onAvailabilityValidityChange} remembered={remembered} />
    {warnings.length>0&&<div role="status" className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300"><h3 className="font-semibold">Atenção à duração diária</h3>{warnings.map(text=><p key={text}>{text}</p>)}</div>}
    {errors.length>0&&<div role="alert" className="space-y-2 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm"><h3 className="font-semibold text-destructive">Ajuste antes de continuar</h3>{errors.map(text=><p key={text}>{text}</p>)}</div>}
  </div>;
}
