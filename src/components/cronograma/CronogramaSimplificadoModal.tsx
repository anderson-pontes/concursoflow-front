import React from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { DIAS, diaAbrev, tipoMap } from "@/lib/cronograma/constants";
import type { DisciplinaOption, SimplificadoFormState, VigenciaModo } from "@/lib/cronograma/types";
import { fmtDateBR, hojeISO, vigenciaFim12Meses } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (form: SimplificadoFormState) => void;
  disciplinas: DisciplinaOption[];
  isSaving: boolean;
};

function defaultForm(): SimplificadoFormState {
  return {
    disciplina_id: "",
    dias_semana: ["seg", "qua", "sex"],
    hora_inicio: "08:00",
    hora_fim: "09:00",
    tipo: "estudo",
    vigencia_modo: "12_meses",
    vigencia_inicio: hojeISO(),
    vigencia_fim: vigenciaFim12Meses(hojeISO()),
  };
}

export function CronogramaSimplificadoModal({
  open,
  onClose,
  onSave,
  disciplinas,
  isSaving,
}: Props) {
  const [form, setForm] = React.useState<SimplificadoFormState>(defaultForm);

  React.useEffect(() => {
    if (open) setForm(defaultForm());
  }, [open]);

  const horaFimInvalida = form.hora_fim <= form.hora_inicio;
  const diasErro = form.dias_semana.length === 0;
  const periodoFimErro =
    form.vigencia_modo === "periodo" &&
    (!form.vigencia_fim || form.vigencia_fim < form.vigencia_inicio);

  const fim12 = vigenciaFim12Meses(form.vigencia_inicio || hojeISO());

  function toggleDia(dia: SimplificadoFormState["dias_semana"][number]) {
    setForm((s) => {
      const has = s.dias_semana.includes(dia);
      return {
        ...s,
        dias_semana: has ? s.dias_semana.filter((d) => d !== dia) : [...s.dias_semana, dia],
      };
    });
  }

  function setModo(modo: VigenciaModo) {
    setForm((s) => ({
      ...s,
      vigencia_modo: modo,
      vigencia_fim:
        modo === "12_meses"
          ? vigenciaFim12Meses(s.vigencia_inicio)
          : modo === "periodo"
            ? s.vigencia_fim || vigenciaFim12Meses(s.vigencia_inicio)
            : "",
    }));
  }

  const canSave =
    Boolean(form.disciplina_id) &&
    !horaFimInvalida &&
    !diasErro &&
    !periodoFimErro &&
    Boolean(form.vigencia_inicio) &&
    !isSaving;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="block w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-card-foreground">
            Cronograma simplificado
          </DialogTitle>
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
            <Select
              value={form.disciplina_id}
              onValueChange={(value) => setForm((s) => ({ ...s, disciplina_id: value }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{disciplinas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-card-foreground">Dias da semana</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Dias da semana">
              {DIAS.map((dia) => {
                const selected = form.dias_semana.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDia(dia)}
                    className={cn(
                      "min-h-11 min-w-11 rounded-lg border px-2.5 text-xs font-semibold transition",
                      selected
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-border bg-card text-card-foreground hover:bg-muted",
                    )}
                  >
                    {diaAbrev[dia]}
                  </button>
                );
              })}
            </div>
            {diasErro ? (
              <p className="mt-1 text-xs text-danger-600">Selecione ao menos um dia.</p>
            ) : null}
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
              {horaFimInvalida ? (
                <p className="mt-1 text-xs text-danger-600">Fim deve ser após o início.</p>
              ) : null}
            </div>
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

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-card-foreground">Vigência</legend>
            <div className="space-y-2" role="radiogroup" aria-label="Modo de vigência">
              {(
                [
                  { id: "periodo" as const, label: "Período" },
                  { id: "12_meses" as const, label: "12 meses" },
                  { id: "indeterminado" as const, label: "Indeterminado" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm",
                    form.vigencia_modo === opt.id
                      ? "border-primary-400 bg-primary-50/60 dark:bg-primary-950/30"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="vigencia_modo"
                    checked={form.vigencia_modo === opt.id}
                    onChange={() => setModo(opt.id)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={form.vigencia_modo === "periodo" ? "" : "col-span-2"}>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Data início
                </label>
                <DatePicker
                  value={form.vigencia_inicio}
                  onValueChange={(value) =>
                    setForm((s) => ({
                      ...s,
                      vigencia_inicio: value,
                      vigencia_fim:
                        s.vigencia_modo === "12_meses"
                          ? vigenciaFim12Meses(value)
                          : s.vigencia_fim,
                    }))
                  }
                />
              </div>
              {form.vigencia_modo === "periodo" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Data fim
                  </label>
                  <DatePicker
                    className={periodoFimErro ? "[&_button]:border-danger-400" : undefined}
                    value={form.vigencia_fim}
                    onValueChange={(value) => setForm((s) => ({ ...s, vigencia_fim: value }))}
                  />
                </div>
              ) : null}
            </div>
            {form.vigencia_modo === "12_meses" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Até {fmtDateBR(fim12)}
              </p>
            ) : null}
            {form.vigencia_modo === "indeterminado" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Repete até você remover
              </p>
            ) : null}
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(form)}
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
