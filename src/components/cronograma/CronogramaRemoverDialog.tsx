import React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Bloco } from "@/lib/cronograma/types";
import { fmtDateBR } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

export type RemoverScope = "one" | "future";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: RemoverScope) => void;
  bloco: Bloco;
  dataAlvo: string; // YYYY-MM-DD
  diaLabel: string;
  isPending?: boolean;
};

function isLegadoSemVigencia(bloco: Bloco): boolean {
  return (
    !bloco.vigencia_inicio &&
    !bloco.vigencia_fim &&
    !bloco.vigencia_indeterminada
  );
}

export function CronogramaRemoverDialog({
  open,
  onClose,
  onConfirm,
  bloco,
  dataAlvo,
  diaLabel,
  isPending = false,
}: Props) {
  const [scope, setScope] = React.useState<RemoverScope>("one");
  const legado = isLegadoSemVigencia(bloco);

  React.useEffect(() => {
    if (open) setScope("one");
  }, [open]);

  const futureLabel = legado
    ? `Remover todos os ${diaLabel} deste horário`
    : "Este dia e os futuros";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
        className="w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-card-foreground">
            Remover do cronograma
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Escolha o escopo da remoção.
          </DialogDescription>
        </div>

        <div className="space-y-2 px-5 py-4" role="radiogroup" aria-label="Escopo da remoção">
          <label
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm",
              scope === "one"
                ? "border-primary-400 bg-primary-50/60 dark:bg-primary-950/30"
                : "border-border hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="remover_scope"
              checked={scope === "one"}
              onChange={() => setScope("one")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-card-foreground">
                Somente este dia ({fmtDateBR(dataAlvo)})
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Mantém as próximas ocorrências desta regra.
              </span>
            </span>
          </label>

          <label
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm",
              scope === "future"
                ? "border-primary-400 bg-primary-50/60 dark:bg-primary-950/30"
                : "border-border hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="remover_scope"
              checked={scope === "future"}
              onChange={() => setScope("future")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-card-foreground">{futureLabel}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {legado
                  ? "Remove o template semanal deste horário (todos os dias da semana)."
                  : "Encerra a partir desta data; o passado permanece."}
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(scope)}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? "Removendo…" : "Remover"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Próxima ocorrência do weekday do bloco (hoje se for o dia). */
export function nextOccurrenceISO(diaSemana: Bloco["dia_semana"], from = new Date()): string {
  const map: Record<Bloco["dia_semana"], number> = {
    dom: 0,
    seg: 1,
    ter: 2,
    qua: 3,
    qui: 4,
    sex: 5,
    sab: 6,
  };
  const target = map[diaSemana];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const delta = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
