import { Pencil } from "lucide-react";

import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DIAS, diaAbrev } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

type Props = {
  isLoading: boolean;
  totalBlocos: number;
  diaHoje: Bloco["dia_semana"];
  grouped: Record<Bloco["dia_semana"], Bloco[]>;
  disciplinaNome: (id: string) => string;
  deletePending: boolean;
  extendPending: boolean;
  onEdit: (bloco: Bloco) => void;
  onRemove: (bloco: Bloco, diaLabel: string) => void;
  onExtend: (bloco: Bloco) => void;
};

export function CronogramaWeekGrid({ isLoading, totalBlocos, diaHoje, grouped, disciplinaNome, deletePending, extendPending, onEdit, onRemove, onExtend }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-4 xl:grid-cols-7 xl:gap-3">
        {DIAS.map((dia) => <Skeleton key={dia} className="h-40 rounded-xl" />)}
      </div>
    );
  }
  if (totalBlocos === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 xl:gap-3" role="list" aria-label="Dias da semana">
      {DIAS.map((dia) => {
        const isHoje = dia === diaHoje;
        const items = grouped[dia] ?? [];
        return (
          <div key={dia} role="listitem" className={cn("min-w-0 rounded-xl border p-2.5 sm:p-3", isHoje ? "border-primary-400 bg-primary-50/60 shadow-sm dark:border-primary-600 dark:bg-primary-950/30" : "border-border bg-card") }>
            <div className="mb-2 flex items-center justify-between gap-1">
              <span className={cn("flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-wide", isHoje ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground") }>
                <span>{diaAbrev[dia]}</span>
                {isHoje ? <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold normal-case text-primary-foreground">hoje</span> : null}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {items.length === 1 ? (
                  <button type="button" title={`Editar ${diaAbrev[dia]}`} aria-label={`Editar bloco de ${diaAbrev[dia]}`} onClick={() => onEdit(items[0])} className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
                {items.length > 0 ? <span className="rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">{items.length}</span> : null}
              </div>
            </div>
            <div className="space-y-2">
              {items.map((bloco) => (
                <CronogramaBlocoCard key={bloco.id} bloco={bloco} disciplinaNome={disciplinaNome(bloco.disciplina_id)} diaLabel={diaAbrev[dia]} onEdit={() => onEdit(bloco)} onDelete={() => onRemove(bloco, diaAbrev[dia])} deletePending={deletePending} estenderPending={extendPending} onEstender={bloco.grupo_id ? () => onExtend(bloco) : undefined} />
              ))}
              {items.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Sem blocos</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
