import React from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DIAS, diaLabels, tipoMap } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, VigenciaModo } from "@/lib/cronograma/types";
import { fmtDateBR, hojeISO, vigenciaFim12Meses } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

export type SimplificadoEditPayload = {
  disciplina_id: string;
  dia_semana: Bloco["dia_semana"];
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  vigencia_indeterminada: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: SimplificadoEditPayload) => void;
  bloco: Bloco;
  disciplinas: DisciplinaOption[];
  isSaving: boolean;
};

function inferModo(bloco: Bloco): VigenciaModo {
  if (bloco.vigencia_indeterminada) return "indeterminado";
  if (bloco.vigencia_inicio && bloco.vigencia_fim) {
    const expected = vigenciaFim12Meses(bloco.vigencia_inicio.slice(0, 10));
    if (bloco.vigencia_fim.slice(0, 10) === expected) return "12_meses";
    return "periodo";
  }
  if (bloco.vigencia_inicio && !bloco.vigencia_fim) return "indeterminado";
  return "periodo";
}

export function CronogramaSimplificadoEditModal({
  open,
  onClose,
  onSave,
  bloco,
  disciplinas,
  isSaving,
}: Props) {
  const [disciplinaId, setDisciplinaId] = React.useState(bloco.disciplina_id);
  const [dia, setDia] = React.useState(bloco.dia_semana);
  const [horaInicio, setHoraInicio] = React.useState(bloco.hora_inicio.slice(0, 5));
  const [horaFim, setHoraFim] = React.useState(bloco.hora_fim.slice(0, 5));
  const [tipo, setTipo] = React.useState(bloco.tipo);
  const [vigenciaModo, setVigenciaModo] = React.useState<VigenciaModo>(() => inferModo(bloco));
  const [vigenciaInicio, setVigenciaInicio] = React.useState(
    bloco.vigencia_inicio?.slice(0, 10) || hojeISO(),
  );
  const [vigenciaFim, setVigenciaFim] = React.useState(
    bloco.vigencia_fim?.slice(0, 10) || vigenciaFim12Meses(hojeISO()),
  );

  React.useEffect(() => {
    if (!open) return;
    setDisciplinaId(bloco.disciplina_id);
    setDia(bloco.dia_semana);
    setHoraInicio(bloco.hora_inicio.slice(0, 5));
    setHoraFim(bloco.hora_fim.slice(0, 5));
    setTipo(bloco.tipo);
    setVigenciaModo(inferModo(bloco));
    setVigenciaInicio(bloco.vigencia_inicio?.slice(0, 10) || hojeISO());
    setVigenciaFim(bloco.vigencia_fim?.slice(0, 10) || vigenciaFim12Meses(hojeISO()));
  }, [open, bloco]);

  const horaFimInvalida = horaFim <= horaInicio;
  const periodoFimErro =
    vigenciaModo === "periodo" && (!vigenciaFim || vigenciaFim < vigenciaInicio);
  const fim12 = vigenciaFim12Meses(vigenciaInicio || hojeISO());

  const canSave =
    Boolean(disciplinaId) && !horaFimInvalida && !periodoFimErro && Boolean(vigenciaInicio) && !isSaving;

  function applyModo(modo: VigenciaModo) {
    setVigenciaModo(modo);
    if (modo === "12_meses") setVigenciaFim(vigenciaFim12Meses(vigenciaInicio));
  }

  function handleSave() {
    const indet = vigenciaModo === "indeterminado";
    onSave({
      disciplina_id: disciplinaId,
      dia_semana: dia,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      tipo,
      vigencia_inicio: vigenciaInicio,
      vigencia_fim: indet ? null : vigenciaModo === "12_meses" ? fim12 : vigenciaFim,
      vigencia_indeterminada: indet,
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
          <div>
            <DialogTitle className="text-base font-semibold text-card-foreground">
              Editar horário (Simplificada)
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Só este dia muda disciplina/horário. Vigência aplica ao grupo inteiro.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Disciplina</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dia</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={dia}
                onChange={(e) => setDia(e.target.value as Bloco["dia_semana"])}
              >
                {DIAS.map((k) => (
                  <option key={k} value={k}>{diaLabels[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tipo</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {Object.entries(tipoMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Início</label>
              <input
                type="time"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fim</label>
              <input
                type="time"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500",
                  horaFimInvalida ? "border-danger-400" : "border-border",
                )}
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Vigência do grupo</legend>
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
                    vigenciaModo === opt.id
                      ? "border-primary-400 bg-primary-50/60 dark:bg-primary-950/30"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="edit_vigencia_modo"
                    checked={vigenciaModo === opt.id}
                    onChange={() => applyModo(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={vigenciaModo === "periodo" ? "" : "col-span-2"}>
                <label className="mb-1.5 block text-xs text-muted-foreground">Data início</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  value={vigenciaInicio}
                  onChange={(e) => {
                    setVigenciaInicio(e.target.value);
                    if (vigenciaModo === "12_meses") setVigenciaFim(vigenciaFim12Meses(e.target.value));
                  }}
                />
              </div>
              {vigenciaModo === "periodo" ? (
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Data fim</label>
                  <input
                    type="date"
                    className={cn(
                      "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500",
                      periodoFimErro ? "border-danger-400" : "border-border",
                    )}
                    value={vigenciaFim}
                    onChange={(e) => setVigenciaFim(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
            {vigenciaModo === "12_meses" ? (
              <p className="mt-2 text-xs text-muted-foreground">Até {fmtDateBR(fim12)}</p>
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
            onClick={handleSave}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
