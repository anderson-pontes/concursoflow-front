import React from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { DIAS, diaAbrev } from "@/lib/cronograma/constants";
import { hojeISO, type PlanejamentoForm } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

const schema = z.object({ nome: z.string().trim().min(1, "Informe o nome.").max(200), data_inicio: z.string().min(1), data_fim: z.string().nullable(), dias_disponiveis: z.array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"])).min(1, "Escolha ao menos um dia."), cargo: z.string().nullable() }).refine(v => !v.data_fim || v.data_fim >= v.data_inicio, "O término deve ser após o início.");
const defaults = (): PlanejamentoForm => ({ nome: "Meu cronograma", data_inicio: hojeISO(), data_fim: null, dias_disponiveis: ["seg", "ter", "qua", "qui", "sex"], cargo: null });

export function PlanejamentoManualDialog({ open, onClose, onSave, initialValues, concursoNome, isSaving }: { open: boolean; onClose: () => void; onSave: (form: PlanejamentoForm) => void; initialValues?: PlanejamentoForm; concursoNome: string; isSaving: boolean }) {
  const [form, setForm] = React.useState<PlanejamentoForm>(defaults);
  const [error, setError] = React.useState("");
  React.useEffect(() => { if (open) { setForm(initialValues ?? defaults()); setError(""); } }, [open, initialValues]);
  function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    onSave(parsed.data);
  }
  return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{initialValues ? "Configurar cronograma" : "Criar cronograma manual"}</DialogTitle><DialogDescription>{concursoNome}. Depois, adicione suas disciplinas e horários.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4">
    <label className="block space-y-1 text-sm font-medium">Nome do cronograma<Input value={form.nome} onChange={e => setForm(s => ({ ...s, nome: e.target.value }))} maxLength={200} required /></label>
    <label className="block space-y-1 text-sm font-medium">Cargo (opcional)<Input value={form.cargo ?? ""} maxLength={150} onChange={e => setForm(s => ({ ...s, cargo: e.target.value || null }))} /></label>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium">Data de início<DatePicker aria-label="Data de início" value={form.data_inicio} onValueChange={value => setForm(s => ({ ...s, data_inicio: value }))} allowClear={false} /></label><label className="space-y-1 text-sm font-medium">Data de término (opcional)<DatePicker aria-label="Data de término" value={form.data_fim ?? ""} min={form.data_inicio} onValueChange={value => setForm(s => ({ ...s, data_fim: value || null }))} /></label></div>
    <fieldset><legend className="mb-2 text-sm font-medium">Dias disponíveis para estudo</legend><div className="flex flex-wrap gap-2">{DIAS.map(d => <button type="button" key={d} aria-pressed={form.dias_disponiveis.includes(d)} onClick={() => setForm(s => ({ ...s, dias_disponiveis: s.dias_disponiveis.includes(d) ? s.dias_disponiveis.filter(v => v !== d) : [...s.dias_disponiveis, d] }))} className={cn("min-h-11 min-w-11 rounded-lg border px-3 text-sm", form.dias_disponiveis.includes(d) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>{diaAbrev[d]}</button>)}</div></fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap justify-end gap-2"><Button variant="outline" type="button" onClick={onClose}>Cancelar</Button><Button disabled={isSaving} type="submit">{isSaving ? "Salvando…" : initialValues ? "Salvar configurações" : "Criar cronograma manual"}</Button></div>
  </form></DialogContent></Dialog>;
}
