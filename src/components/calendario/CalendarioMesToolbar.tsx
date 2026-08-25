import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <div className="flex items-center gap-1" role="group" aria-label="Navegação do calendário">
        <Button
          type="button"
          variant="outline"
          onClick={onToday}
          className="h-11 text-muted-foreground"
        >
          Hoje
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onPrev}
          aria-label="Mês anterior"
          className="text-muted-foreground"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onNext}
          aria-label="Próximo mês"
          className="text-muted-foreground"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
