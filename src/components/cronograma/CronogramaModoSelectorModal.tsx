import React from "react";
import { CalendarDays, Layers, Sparkles, X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CronogramaModo = "automatica" | "analitica" | "simplificada";

type ModeOption = {
  id: CronogramaModo;
  title: string;
  description: string;
  icon: React.ElementType;
  ariaLabel: string;
  showIaBadge?: boolean;
};

const OPTIONS: ModeOption[] = [
  {
    id: "automatica",
    title: "Automática",
    description: "Gera o plano pelos tópicos, usando peso no edital e seu domínio.",
    icon: Sparkles,
    showIaBadge: true,
    ariaLabel:
      "Automática, assistida por IA: gera horários pelos tópicos com base em peso e domínio",
  },
  {
    id: "analitica",
    title: "Analítica",
    description: "Você define o horário e pode escolher um ou mais tópicos da disciplina.",
    icon: Layers,
    ariaLabel: "Analítica: define horários e, se quiser, os tópicos do edital",
  },
  {
    id: "simplificada",
    title: "Simplificada",
    description: "Só a disciplina e os dias da semana, com ou sem período de vigência.",
    icon: CalendarDays,
    ariaLabel: "Simplificada: só disciplina e dias da semana, com ou sem período",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (modo: CronogramaModo) => void;
};

export function CronogramaModoSelectorModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        hideClose
        className="flex max-h-[90dvh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-card-foreground">
              Como deseja criar?
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Escolha um modo para continuar
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto px-5 py-4">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                aria-label={opt.ariaLabel}
                onClick={() => onSelect(opt.id)}
                className={cn(
                  "flex min-h-11 w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors",
                  "hover:border-primary/40 hover:bg-primary-50/50 dark:hover:bg-primary-950/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-card-foreground">{opt.title}</span>
                    {opt.showIaBadge ? (
                      <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                        IA
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-card-foreground hover:bg-muted"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
