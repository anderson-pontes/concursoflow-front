import React from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIAS, diaAbrev } from "@/lib/cronograma/constants";
import { activityMinutes } from "@/lib/cronograma/activityPresentation";
import type { Bloco, DisciplinaOption, Planejamento } from "@/lib/cronograma/types";

type Props = {
  plan: Planejamento;
  activities: Bloco[];
  disciplines: DisciplinaOption[];
  saving: boolean;
  onSaveAvailability: (value: NonNullable<Planejamento["disponibilidade_minutos"]>) => void;
  onAdd: (day: Bloco["dia_semana"], disciplineId: string, minutes: number) => void;
  onRemove: (block: Bloco) => void;
};

function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
}

const fullDayName: Record<Bloco["dia_semana"], string> = {
  seg: "Segunda-feira", ter: "Terça-feira", qua: "Quarta-feira", qui: "Quinta-feira",
  sex: "Sexta-feira", sab: "Sábado", dom: "Domingo",
};

export function PlanejamentoSemanalManual({ plan, activities, disciplines, saving, onSaveAvailability, onAdd, onRemove }: Props) {
  const [day, setDay] = React.useState<Bloco["dia_semana"]>("seg");
  const [disciplineId, setDisciplineId] = React.useState("");
  const [minutes, setMinutes] = React.useState(30);
  const [availability, setAvailability] = React.useState<NonNullable<Planejamento["disponibilidade_minutos"]>>(plan.disponibilidade_minutos ?? {});
  const [availabilityDirty, setAvailabilityDirty] = React.useState(false);
  React.useEffect(() => {
    setAvailability(plan.disponibilidade_minutos ?? {});
    setAvailabilityDirty(false);
  }, [plan.id, plan.disponibilidade_minutos]);

  const daily = DIAS.map((key) => {
    const blocks = activities.filter((block) => block.dia_semana === key && block.ativo);
    const planned = blocks.reduce((sum, block) => sum + activityMinutes(block), 0);
    const available = availability[key] ?? 0;
    return { key, blocks, planned, available, remaining: available - planned };
  });
  const selected = daily.find((item) => item.key === day)!;
  const weeklyAvailable = daily.reduce((sum, item) => sum + item.available, 0);
  const weeklyPlanned = daily.reduce((sum, item) => sum + item.planned, 0);

  return <section className="space-y-4 rounded-xl border border-border bg-card p-4" aria-labelledby="manual-week-plan-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="manual-week-plan-title" className="font-semibold">Planejamento semanal</h2><p className="text-sm text-muted-foreground">Distribua disciplinas e acompanhe a carga de cada dia.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Manual</span></div>
    <div className="grid grid-cols-3 gap-3 text-sm"><div><p className="text-lg font-semibold">{formatMinutes(weeklyAvailable)}</p><p className="text-xs text-muted-foreground">Disponíveis</p></div><div><p className="text-lg font-semibold">{formatMinutes(weeklyPlanned)}</p><p className="text-xs text-muted-foreground">Planejadas</p></div><div><p className="text-lg font-semibold">{formatMinutes(weeklyAvailable - weeklyPlanned)}</p><p className="text-xs text-muted-foreground">Restantes</p></div></div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Dia do planejamento semanal">{DIAS.map((key) => <button type="button" aria-pressed={day === key} key={key} onClick={() => setDay(key)} className={`min-h-10 rounded-full border px-3 text-sm ${day === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{diaAbrev[key]}</button>)}</div>
    <div className="rounded-xl border border-border p-3"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">{fullDayName[day]}</h3><span className={`text-xs ${selected.remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>{formatMinutes(selected.planned)} / {formatMinutes(selected.available)}</span></div>
      {selected.blocks.length ? <ul className="divide-y divide-border">{selected.blocks.map((block) => <li key={`${block.id}-${block.data}`} className="flex items-center gap-3 py-2"><span className="min-w-0 flex-1 border-l-4 border-primary pl-2"><span className="block truncate text-sm font-medium">{disciplines.find((item) => item.id === block.disciplina_id)?.nome ?? "Disciplina"}</span><span className="text-xs text-muted-foreground">{formatMinutes(activityMinutes(block))} de estudo</span></span><Button variant="ghost" size="icon" aria-label={`Remover ${disciplines.find((item) => item.id === block.disciplina_id)?.nome ?? "atividade"} de ${diaAbrev[day]}`} onClick={() => onRemove(block)}><Trash2 className="size-4" /></Button></li>)}</ul> : <p className="py-3 text-sm text-muted-foreground">Nenhuma disciplina planejada para este dia.</p>}
      <div className="mt-3 space-y-2 border-t border-border pt-3"><p className="text-sm font-medium">Adicionar disciplina</p><Select value={disciplineId} onValueChange={setDisciplineId}><SelectTrigger aria-label="Disciplina para adicionar"><SelectValue placeholder="Selecione uma disciplina" /></SelectTrigger><SelectContent>{plan.disciplinas.map((item) => <SelectItem key={item.disciplina_id} value={item.disciplina_id}>{item.nome}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Select value={String(minutes)} onValueChange={(value) => setMinutes(Number(value))}><SelectTrigger aria-label="Duração da sessão"><Clock className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 45, 60, 75, 90, 120, 150, 180, 225].map((value) => <SelectItem key={value} value={String(value)}>{value < 60 ? `${value} minutos` : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}min` : ""}`}</SelectItem>)}</SelectContent></Select><Button disabled={!disciplineId || saving || minutes > selected.remaining} onClick={() => { onAdd(day, disciplineId, minutes); setDisciplineId(""); }}><Plus className="size-4" />Adicionar</Button></div>{minutes > selected.remaining && <p role="alert" className="text-xs text-destructive">A duração selecionada ultrapassa a disponibilidade deste dia.</p>}</div>
    </div>
    <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Editar disponibilidade diária</summary><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{DIAS.map((key) => <label key={key} className="space-y-1 text-xs text-muted-foreground">{diaAbrev[key]} · minutos<Input type="number" min={0} max={1440} step={15} value={availability[key] ?? 0} onChange={(event) => { setAvailability((current) => ({ ...current, [key]: Number(event.target.value) })); setAvailabilityDirty(true); }} /></label>)}</div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm">Total: {formatMinutes(weeklyAvailable)}</p><Button disabled={!availabilityDirty || saving} onClick={() => onSaveAvailability(availability)}>Salvar disponibilidade</Button></div></details>
  </section>;
}
