import { ChevronLeft, ChevronRight } from "lucide-react";

import { fmtMesAno } from "@/lib/calendario/format";

type Props = {
  ano: number;
  mes: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarioMesToolbar({ ano, mes, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-foreground">{fmtMesAno(ano, mes)}</h2>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToday}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Mês anterior"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Próximo mês"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
