import { cn } from "@/lib/utils";
import type { CalendarioDia } from "@/lib/calendario/types";
import { STATUS_CELL_CLASS, STATUS_DOT_CLASS, STATUS_LABEL } from "@/lib/calendario/constants";
import { fmtMinutosEstudo } from "@/lib/calendario/format";

type Props = {
  dia: CalendarioDia | null;
  diaNumero: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick?: () => void;
};

export function CalendarioDiaCell({ dia, diaNumero, isCurrentMonth, isToday, onClick }: Props) {
  const status = dia?.status ?? (isCurrentMonth ? "sem_planejamento" : "futuro");
  const disabled = !isCurrentMonth || status === "futuro";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={
        dia
          ? `${dia.data}: ${STATUS_LABEL[dia.status]} — ${fmtMinutosEstudo(dia.minutos_realizados)}/${fmtMinutosEstudo(dia.minutos_planejados)}`
          : undefined
      }
      className={cn(
        "flex min-h-[88px] flex-col rounded-lg border p-2 text-left transition hover:ring-2 hover:ring-primary-400/50 disabled:cursor-default disabled:opacity-40 disabled:hover:ring-0 sm:min-h-[104px]",
        isCurrentMonth ? STATUS_CELL_CLASS[status] : "border-transparent bg-transparent",
        isToday && "ring-2 ring-primary-500 ring-offset-1",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isToday ? "text-primary-700 dark:text-primary-300" : "text-foreground",
            !isCurrentMonth && "text-muted-foreground/40",
          )}
        >
          {diaNumero}
        </span>
        {dia && isCurrentMonth && status !== "futuro" && status !== "sem_planejamento" ? (
          <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
        ) : null}
      </div>
      {dia && isCurrentMonth && dia.status !== "futuro" ? (
        <div className="mt-auto space-y-0.5 pt-1">
          {dia.minutos_planejados > 0 ? (
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {fmtMinutosEstudo(dia.minutos_realizados)} / {fmtMinutosEstudo(dia.minutos_planejados)}
            </p>
          ) : dia.minutos_realizados > 0 ? (
            <p className="truncate text-xs font-medium leading-tight text-sky-700 dark:text-sky-300">
              {fmtMinutosEstudo(dia.minutos_realizados)}
            </p>
          ) : null}
          {dia.sessoes_realizadas > 0 ? (
            <p className="text-xs leading-tight text-muted-foreground">{dia.sessoes_realizadas} sess.</p>
          ) : dia.minutos_planejados === 0 && dia.minutos_realizados === 0 ? (
            <p className="text-xs leading-tight text-muted-foreground/70">Sem estudo</p>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
