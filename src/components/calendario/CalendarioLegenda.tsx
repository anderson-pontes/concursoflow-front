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

export function CalendarioLegenda({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Legenda</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`} />
            {STATUS_LABEL[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
