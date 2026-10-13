import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import type { Bloco, DisciplinaOption, FormState } from "@/lib/cronograma/types";
import { blocoTopicoIds, hojeISO } from "@/lib/cronograma/types";

export type ActivityPayload = { form: FormState; scope: "one" | "future" | "all"; data: string; repeat: boolean };
/** Escopo e data ficam no mesmo formulário da atividade. */
export function AtividadeDialog({ open, onClose, onSave, disciplinas, bloco, initialValues, initialDate, isSaving, duplicate }: { open: boolean; onClose: () => void; onSave: (payload: ActivityPayload) => void; disciplinas: DisciplinaOption[]; bloco?: Bloco | null; initialValues?: Partial<FormState>; initialDate?: string; isSaving: boolean; duplicate?: boolean }) {
  const [scope, setScope] = React.useState<ActivityPayload["scope"]>("future");
  const [date, setDate] = React.useState(initialDate ?? hojeISO());
  const [repeat, setRepeat] = React.useState(true);
  React.useEffect(() => { if (open) { setScope("future"); setDate(initialDate ?? hojeISO()); setRepeat(true); } }, [open, initialDate]);
  const values = React.useMemo(() => bloco ? { disciplina_id: bloco.disciplina_id, dia_semana: bloco.dia_semana, hora_inicio: bloco.hora_inicio.slice(0, 5) || "08:00", hora_fim: bloco.hora_fim.slice(0, 5) || "09:00", tipo: bloco.tipo, ativo: bloco.ativo, topico_ids: blocoTopicoIds(bloco) } : initialValues, [bloco, initialValues]);
  return <BlocoFormModal open={open} onClose={onClose} onSave={form => onSave({ form, scope, data: date, repeat })} disciplinas={disciplinas} initialValues={values} title={duplicate ? "Duplicar atividade" : bloco ? "Editar atividade" : "Adicionar atividade"} isSaving={isSaving} extraFields={<div className="space-y-3"><label className="block space-y-1 text-sm font-medium">Data da ocorrência<DatePicker aria-label="Data da ocorrência" value={date} onValueChange={setDate} allowClear={false} /></label>{bloco && !duplicate ? <fieldset><legend className="mb-2 text-sm font-medium">Aplicar alteração</legend>{([["one", "Somente esta ocorrência"], ["future", "Esta e as próximas ocorrências"], ["all", "Toda a série"]] as const).map(([id, label]) => <label key={id} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="activity-scope" checked={scope === id} onChange={() => setScope(id)} />{label}</label>)}<p className="text-xs text-muted-foreground">Sessões de estudo realizadas serão preservadas.</p></fieldset> : <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} />Repetir semanalmente</label>}</div>} />;
}

export function RemoverDisciplinaDialog({ name, open, pending, onClose, onConfirm }: { name: string; open: boolean; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  const [confirmHistory, setConfirmHistory] = React.useState(false);
  React.useEffect(() => { if (open) setConfirmHistory(false); }, [open]);
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent><DialogHeader><DialogTitle>Remover {name} do cronograma?</DialogTitle><DialogDescription>Os horários futuros serão retirados. Sessões, questões, revisões e o histórico de estudo permanecem disponíveis.</DialogDescription></DialogHeader><label className="flex min-h-11 items-start gap-2 text-sm"><input type="checkbox" checked={confirmHistory} onChange={e => setConfirmHistory(e.target.checked)} /><span>Confirmo a retirada da disciplina e preservação de todo o histórico.</span></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="destructive" disabled={!confirmHistory || pending} onClick={onConfirm}>{pending ? "Removendo…" : "Remover do cronograma"}</Button></div></DialogContent></Dialog>;
}
