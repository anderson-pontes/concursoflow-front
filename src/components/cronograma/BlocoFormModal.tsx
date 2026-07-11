import React from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DIAS, defaultForm, diaLabels, tipoMap } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, FormState } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

export type BlocoFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (form: FormState) => void;
  disciplinas: DisciplinaOption[];
  initialValues?: Partial<FormState>;
  title: string;
  isSaving: boolean;
};

export function BlocoFormModal({
  open,
  onClose,
  onSave,
  disciplinas,
  initialValues,
  title,
  isSaving,
}: BlocoFormModalProps) {
  const [form, setForm] = React.useState<FormState>({ ...defaultForm, ...initialValues });

  React.useEffect(() => {
    if (open) setForm({ ...defaultForm, ...initialValues });
  }, [open, initialValues]);

  const horaFimInvalida = form.hora_fim <= form.hora_inicio;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="block w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-card-foreground">{title}</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              value={form.disciplina_id}
              onChange={(e) => setForm((s) => ({ ...s, disciplina_id: e.target.value }))}
            >
              <option value="" disabled>Selecione...</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Dia</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.dia_semana}
                onChange={(e) => setForm((s) => ({ ...s, dia_semana: e.target.value as Bloco["dia_semana"] }))}
              >
                {DIAS.map((k) => <option key={k} value={k}>{diaLabels[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Tipo</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.tipo}
                onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
              >
                {Object.entries(tipoMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Início</label>
              <input
                type="time"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                value={form.hora_inicio}
                onChange={(e) => setForm((s) => ({ ...s, hora_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Fim</label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500 bg-background",
                  horaFimInvalida ? "border-danger-400" : "border-border",
                )}
                value={form.hora_fim}
                onChange={(e) => setForm((s) => ({ ...s, hora_fim: e.target.value }))}
              />
              {horaFimInvalida ? <p className="mt-1 text-xs text-danger-600">Fim deve ser após o início.</p> : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!form.disciplina_id || horaFimInvalida || isSaving}
            onClick={() => onSave(form)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
