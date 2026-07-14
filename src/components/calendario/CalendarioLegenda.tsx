import type { DiaStatus } from "@/lib/calendario/types";
import { STATUS_DOT_CLASS, STATUS_LABEL } from "@/lib/calendario/constants";

const LEGEND_STATUSES: DiaStatus[] = [
  "cumprido",
  "parcial",
  "nao_cumprido",
  "estudou_sem_plano",
  "sem_planejamento",
  "futuro",
];

const LEGEND_HINT: Partial<Record<DiaStatus, string>> = {
  futuro: "dias à frente; se houver plano no cronograma, mostra os minutos",
};

export function CalendarioLegenda({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Legenda</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_STATUSES.map((status) => (
          <div key={status} className="flex max-w-xs items-start gap-1.5 text-sm text-muted-foreground">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                status === "futuro" ? "bg-primary-400/70" : STATUS_DOT_CLASS[status]
              }`}
            />
            <span>
              <span className="text-foreground/80">{STATUS_LABEL[status]}</span>
              {LEGEND_HINT[status] ? (
                <span className="block text-xs text-muted-foreground">— {LEGEND_HINT[status]}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
