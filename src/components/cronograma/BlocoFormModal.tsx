import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
            <Select
              value={form.disciplina_id}
              onValueChange={(value) =>
                setForm((s) => ({
                  ...s,
                  disciplina_id: value,
                  topico_ids: [],
                }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{disciplinas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Dia</label>
              <Select
                value={form.dia_semana}
                onValueChange={(value) => setForm((s) => ({ ...s, dia_semana: value as Bloco["dia_semana"] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIAS.map((k) => <SelectItem key={k} value={k}>{diaLabels[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Tipo</label>
              <Select
                value={form.tipo}
                onValueChange={(value) => setForm((s) => ({ ...s, tipo: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Início</label>
              <TimePicker
                aria-label="Horário de início"
                value={form.hora_inicio}
                onValueChange={(value) => setForm((s) => ({ ...s, hora_inicio: value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Fim</label>
              <TimePicker
                aria-label="Horário de fim"
                aria-invalid={horaFimInvalida}
                value={form.hora_fim}
                onValueChange={(value) => setForm((s) => ({ ...s, hora_fim: value }))}
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
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTopico(t.id)}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!form.disciplina_id || horaFimInvalida || isSaving}
            onClick={() => onSave(form)}
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
