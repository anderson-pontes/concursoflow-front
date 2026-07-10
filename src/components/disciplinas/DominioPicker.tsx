import React from "react";

import { cn } from "@/lib/utils";
import { DOMINIO_LABELS } from "@/lib/topicos/prioridade";

export type DominioPickerProps = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function DominioPicker({ value, onChange, disabled = false, size = "md" }: DominioPickerProps) {
  const dot = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
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
            aria-pressed={n <= value}
            onClick={() => onChange(n)}
            className={cn(
              "rounded-full border-2 transition-colors",
              dot,
              n <= value
                ? "border-slate-900 bg-slate-900 dark:border-neutral-100 dark:bg-neutral-100"
                : "border-slate-300 bg-white hover:border-slate-400 dark:border-neutral-600 dark:bg-neutral-900",
              disabled && "cursor-not-allowed opacity-50",
            )}
          />
        ))}
      </div>
      <span className="hidden text-[10px] text-slate-500 dark:text-neutral-400 sm:inline">
        {DOMINIO_LABELS[value] ?? ""}
      </span>
    </div>
  );
}
