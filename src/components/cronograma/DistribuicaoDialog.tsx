import React from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DIAS, diaAbrev, tipoMap } from "@/lib/cronograma/constants";
import type { Bloco, DistribuicaoForm, Planejamento } from "@/lib/cronograma/types";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

const schema = z.object({ disciplina_ids: z.array(z.string()).min(1, "Selecione disciplinas."), dias_semana: z.array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"])).min(1, "Selecione dias."), hora_inicio: z.string().regex(/^\d{2}:\d{2}$/), hora_fim: z.string().optional(), duracao_minutos: z.number().int().min(5).max(240), sessoes_por_semana: z.number().int().min(1).max(21), tipo: z.string(), topico_ids: z.array(z.string()) });

export function DistribuicaoDialog({ open, onClose, onSave, plano, initialIds, blocos, isSaving }: { open: boolean; onClose: () => void; onSave: (form: DistribuicaoForm) => void; plano: Planejamento; initialIds: string[]; blocos: Bloco[]; isSaving: boolean }) {
  const [form, setForm] = React.useState<DistribuicaoForm>({ disciplina_ids: initialIds, dias_semana: plano.dias_disponiveis, hora_inicio: "08:00", duracao_minutos: 60, sessoes_por_semana: plano.dias_disponiveis.length, tipo: "estudo", topico_ids: [] });
  const [error, setError] = React.useState("");
  React.useEffect(() => { if (open) { setForm({ disciplina_ids: initialIds, dias_semana: plano.dias_disponiveis, hora_inicio: "08:00", duracao_minutos: 60, sessoes_por_semana: Math.max(1, plano.dias_disponiveis.length), tipo: "estudo", topico_ids: [] }); setError(""); } }, [open, initialIds, plano.dias_disponiveis]);
  const singleId = form.disciplina_ids.length === 1 ? form.disciplina_ids[0] : "";
  const topics = useQuery({ queryKey: ["bloco-form-topicos", singleId], enabled: open && Boolean(singleId), queryFn: async () => (await api.get(`/disciplinas/${singleId}/topicos`)).data as { id: string; descricao: string }[] });
  const [hours, minutes] = form.hora_inicio.split(":").map(Number);
  const counts: Partial<Record<Bloco["dia_semana"], number>> = {};
  const preview = form.disciplina_ids.flatMap(id => Array.from({ length: Math.min(21, Math.max(0, form.sessoes_por_semana || 0)) }, (_, index) => {
    const day = form.dias_semana[index % form.dias_semana.length];
    const start = hours * 60 + minutes + (counts[day] ?? 0) * form.duracao_minutos;
    counts[day] = (counts[day] ?? 0) + 1;
    return { id, day, start, end: start + form.duracao_minutos };
  }));
  const conflict = preview.some(row => row.end > 1439 || (form.hora_fim ? row.end > Number(form.hora_fim.slice(0, 2)) * 60 + Number(form.hora_fim.slice(3, 5)) : false) || blocos.some(b => { const start = Number(b.hora_inicio.slice(0, 2)) * 60 + Number(b.hora_inicio.slice(3, 5)); const end = Number(b.hora_fim.slice(0, 2)) * 60 + Number(b.hora_fim.slice(3, 5)); return b.ativo && b.dia_semana === row.day && row.start < end && row.end > start && (!b.vigencia_fim || b.vigencia_fim >= plano.data_inicio) && (!plano.data_fim || !b.vigencia_inicio || b.vigencia_inicio <= plano.data_fim); }));
  const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Configurar distribuição</DialogTitle><DialogDescription>Adiciona novas sessões em sequência, sem substituir horários atuais. Os registros de estudo permanecem intactos.</DialogDescription></DialogHeader>
    <fieldset><legend className="mb-2 text-sm font-medium">Disciplinas</legend><div className="max-h-36 space-y-2 overflow-y-auto">{plano.disciplinas.map(d => <label key={d.disciplina_id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.disciplina_ids.includes(d.disciplina_id)} onChange={e => setForm(s => ({ ...s, disciplina_ids: e.target.checked ? [...s.disciplina_ids, d.disciplina_id] : s.disciplina_ids.filter(id => id !== d.disciplina_id), topico_ids: [] }))} />{d.nome}</label>)}</div></fieldset>
    <fieldset><legend className="mb-2 text-sm font-medium">Dias da semana</legend><div className="flex flex-wrap gap-2">{DIAS.map(d => <button type="button" key={d} aria-pressed={form.dias_semana.includes(d)} className={cn("min-h-11 min-w-11 rounded-lg border px-2 text-sm", form.dias_semana.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")} onClick={() => setForm(s => ({ ...s, dias_semana: s.dias_semana.includes(d) ? s.dias_semana.filter(v => v !== d) : [...s.dias_semana, d] }))}>{diaAbrev[d]}</button>)}</div></fieldset>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">Horário de início<TimePicker aria-label="Horário de início" value={form.hora_inicio} onValueChange={value => setForm(s => ({ ...s, hora_inicio: value }))} /></label><label className="space-y-1 text-sm">Fim da disponibilidade (opcional)<TimePicker aria-label="Fim da disponibilidade" value={form.hora_fim ?? "23:59"} onValueChange={value => setForm(s => ({ ...s, hora_fim: value }))} /></label><label className="space-y-1 text-sm">Duração (minutos)<Input type="number" min={5} max={240} value={form.duracao_minutos} onChange={e => setForm(s => ({ ...s, duracao_minutos: Number(e.target.value) }))} /></label><label className="space-y-1 text-sm">Sessões por semana, por disciplina<Input type="number" min={1} max={21} value={form.sessoes_por_semana} onChange={e => setForm(s => ({ ...s, sessoes_por_semana: Number(e.target.value) }))} /></label></div>
    <label className="block space-y-1 text-sm">Tipo de estudo<Select value={form.tipo} onValueChange={value => setForm(s => ({ ...s, tipo: value }))}><SelectTrigger aria-label="Tipo de estudo"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(tipoMap).map(([id, v]) => <SelectItem key={id} value={id}>{v.label}</SelectItem>)}</SelectContent></Select></label>
    {singleId && Boolean(topics.data?.length) && <fieldset><legend className="text-sm font-medium">Tópicos (opcional)</legend>{topics.data?.map(t => <label key={t.id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.topico_ids.includes(t.id)} onChange={e => setForm(s => ({ ...s, topico_ids: e.target.checked ? [...s.topico_ids, t.id] : s.topico_ids.filter(id => id !== t.id) }))} />{t.descricao}</label>)}</fieldset>}
    <section className="rounded-lg border border-border bg-muted/30 p-3"><h3 className="mb-2 text-sm font-medium">Prévia dos horários</h3><ul className="max-h-36 space-y-1 overflow-y-auto text-xs">{preview.map((row, i) => <li key={i}>{diaAbrev[row.day]} · {time(row.start)}–{time(row.end)} · {plano.disciplinas.find(d => d.disciplina_id === row.id)?.nome}</li>)}</ul><p className="mt-2 text-xs text-muted-foreground">O fim de cada sessão é calculado pela duração. Para mudar uma sessão existente, use Editar distribuição.</p></section>
    {conflict && <p role="alert" className="text-sm text-destructive">Há conflito com horários existentes ou sessões após o fim do dia. Escolha outro início ou ajuste os dias.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={isSaving || conflict} onClick={() => { const parsed = schema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0].message); return; } onSave(parsed.data); }}>{isSaving ? "Salvando…" : "Salvar distribuição"}</Button></div>
  </DialogContent></Dialog>;
}
