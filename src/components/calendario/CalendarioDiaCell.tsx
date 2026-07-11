import { cn } from "@/lib/utils";
import type { CalendarioDia } from "@/lib/calendario/types";
import { STATUS_CELL_CLASS, STATUS_LABEL } from "@/lib/calendario/constants";
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
        "flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition hover:ring-2 hover:ring-primary-400/50 disabled:cursor-default disabled:opacity-40 disabled:hover:ring-0 sm:min-h-[84px]",
        isCurrentMonth ? STATUS_CELL_CLASS[status] : "border-transparent bg-transparent",
        isToday && "ring-2 ring-primary-500 ring-offset-1",
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          isToday ? "text-primary-700 dark:text-primary-300" : "text-foreground",
          !isCurrentMonth && "text-muted-foreground/40",
        )}
      >
        {diaNumero}
      </span>
      {dia && isCurrentMonth && dia.status !== "futuro" ? (
        <div className="mt-auto space-y-0.5">
          {dia.minutos_planejados > 0 ? (
            <p className="truncate text-[9px] text-muted-foreground">
              {fmtMinutosEstudo(dia.minutos_realizados)} / {fmtMinutosEstudo(dia.minutos_planejados)}
            </p>
          ) : dia.minutos_realizados > 0 ? (
            <p className="truncate text-[9px] font-medium text-sky-700 dark:text-sky-300">
              {fmtMinutosEstudo(dia.minutos_realizados)}
            </p>
          ) : null}
          {dia.sessoes_realizadas > 0 ? (
            <p className="text-[8px] text-muted-foreground">{dia.sessoes_realizadas} sess.</p>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
