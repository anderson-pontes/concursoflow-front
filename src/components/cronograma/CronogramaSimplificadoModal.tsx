import React from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              value={form.disciplina_id}
              onChange={(e) => setForm((s) => ({ ...s, disciplina_id: e.target.value }))}
            >
              <option value="" disabled>Selecione...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
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
              <input
                type="time"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={form.hora_inicio}
                onChange={(e) => setForm((s) => ({ ...s, hora_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Fim</label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500",
                  horaFimInvalida ? "border-danger-400" : "border-border",
                )}
                value={form.hora_fim}
                onChange={(e) => setForm((s) => ({ ...s, hora_fim: e.target.value }))}
              />
              {horaFimInvalida ? (
                <p className="mt-1 text-xs text-danger-600">Fim deve ser após o início.</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Tipo</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
            >
              {Object.entries(tipoMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
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
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.vigencia_inicio}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      vigencia_inicio: e.target.value,
                      vigencia_fim:
                        s.vigencia_modo === "12_meses"
                          ? vigenciaFim12Meses(e.target.value)
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
                  <input
                    type="date"
                    className={cn(
                      "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500",
                      periodoFimErro ? "border-danger-400" : "border-border",
                    )}
                    value={form.vigencia_fim}
                    onChange={(e) => setForm((s) => ({ ...s, vigencia_fim: e.target.value }))}
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
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
