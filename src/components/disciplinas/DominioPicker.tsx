import React from "react";

import { cn } from "@/lib/utils";
import { DOMINIO_LABELS } from "@/lib/topicos/prioridade";

export type DominioPickerProps = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  comfortable?: boolean;
};

export function DominioPicker({ value, onChange, disabled = false, size = "md", comfortable = false }: DominioPickerProps) {
  const dot = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const activeTone = ["", "border-muted-foreground bg-muted", "border-destructive bg-destructive", "border-warning bg-warning", "border-info bg-info", "border-success bg-success"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" role="group" aria-label="Nível de domínio">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            title={DOMINIO_LABELS[n]}
            aria-label={`Domínio ${n}: ${DOMINIO_LABELS[n]}`}
            aria-pressed={comfortable ? n === value : n <= value}
            onClick={() => onChange(n)}
            className={cn(
              comfortable ? "flex h-11 w-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring xl:h-7 xl:w-7" : "rounded-full border-2 transition-colors",
              !comfortable && dot,
              !comfortable && (n <= value
                ? "border-slate-900 bg-slate-900 border-border dark:bg-muted"
                : "border-border bg-card hover:border-slate-400 border-border bg-card"),
              disabled && "cursor-not-allowed opacity-50",
            )}
          >{comfortable && <span className={cn("h-4 w-4 rounded-full border-2", n <= value ? activeTone[n] : "border-input bg-background", n === value && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card")} />}</button>
        ))}
      </div>
      <span className={comfortable ? "text-xs text-muted-foreground" : "hidden text-[10px] text-muted-foreground sm:inline"}>
        {DOMINIO_LABELS[value] ?? ""}
      </span>
    </div>
  );
}
