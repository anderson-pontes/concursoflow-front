import React from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const REVISAO_DIAS_PADRAO = [1, 7, 30, 60, 120] as const;

export function sortDiasAsc(dias: number[]): number[] {
  return [...dias].sort((a, b) => a - b);
}

export function diasEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = sortDiasAsc(a);
  const sb = sortDiasAsc(b);
  return sa.every((n, i) => n === sb[i]);
}

type RevisaoDiasChipsProps = {
  dias: number[];
  onChange: (dias: number[]) => void;
  disabled?: boolean;
};

export function RevisaoDiasChips({ dias, onChange, disabled = false }: RevisaoDiasChipsProps) {
  const [draftAdd, setDraftAdd] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);

  const tryAdd = () => {
    const n = Number(draftAdd.trim());
    if (!Number.isInteger(n) || n <= 0) {
      setAddError("Informe um número inteiro maior que zero.");
      return;
    }
    if (dias.includes(n)) {
      setAddError("Esse intervalo já está na lista.");
      return;
    }
    setAddError(null);
    setDraftAdd("");
    onChange(sortDiasAsc([...dias, n]));
  };

  const remove = (n: number) => {
    onChange(dias.filter((d) => d !== n));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {dias.map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm font-medium tabular-nums text-foreground"
          >
            {n}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remover ${n} dias`}
              onClick={() => remove(n)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
        {dias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Adicione ao menos um intervalo</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          disabled={disabled}
          value={draftAdd}
          onChange={(e) => {
            setDraftAdd(e.target.value);
            if (addError) setAddError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              tryAdd();
            }
          }}
          placeholder="Dias"
          aria-label="Adicionar intervalo em dias"
          className={cn(
            "min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[8rem]",
            addError && "border-destructive",
          )}
        />
        <button
          type="button"
          disabled={disabled || !draftAdd.trim()}
          onClick={tryAdd}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar
        </button>
      </div>
      {addError ? <p className="text-xs text-destructive">{addError}</p> : null}
    </div>
  );
}
