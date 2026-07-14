import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DIAS, defaultForm, diaLabels, tipoMap } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, FormState } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export type BlocoFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (form: FormState) => void;
  disciplinas: DisciplinaOption[];
  initialValues?: Partial<FormState>;
  title: string;
  isSaving: boolean;
};

type TopicoOption = { id: string; descricao: string };

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
    if (open) setForm({ ...defaultForm, ...initialValues, topico_ids: initialValues?.topico_ids ?? [] });
  }, [open, initialValues]);

  const { data: topicos = [], isLoading: loadingTopicos } = useQuery({
    queryKey: ["bloco-form-topicos", form.disciplina_id],
    enabled: open && Boolean(form.disciplina_id),
    queryFn: async () => {
      const rows = (await api.get(`/disciplinas/${form.disciplina_id}/topicos`)).data as TopicoOption[];
      return rows;
    },
  });

  const horaFimInvalida = form.hora_fim <= form.hora_inicio;

  function toggleTopico(id: string) {
    setForm((s) => {
      const has = s.topico_ids.includes(id);
      return {
        ...s,
        topico_ids: has ? s.topico_ids.filter((t) => t !== id) : [...s.topico_ids, id],
      };
    });
  }

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

        <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              value={form.disciplina_id}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  disciplina_id: e.target.value,
                  topico_ids: [],
                }))
              }
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Tópicos <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            {!form.disciplina_id ? (
              <p className="text-xs text-muted-foreground">Selecione uma disciplina para listar tópicos.</p>
            ) : loadingTopicos ? (
              <p className="text-xs text-muted-foreground">Carregando tópicos…</p>
            ) : topicos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum tópico cadastrado nesta disciplina.</p>
            ) : (
              <div
                className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2"
                role="group"
                aria-label="Tópicos opcionais da disciplina"
              >
                {topicos.map((t) => {
                  const checked = form.topico_ids.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                        checked ? "bg-primary-50 dark:bg-primary-950/40" : "hover:bg-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTopico(t.id)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="min-w-0 truncate text-card-foreground">{t.descricao}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">Nenhum selecionado = só a disciplina.</p>
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
