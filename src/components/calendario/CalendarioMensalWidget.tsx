import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { CalendarioMensalGrid } from "./CalendarioMensalGrid";
import { CalendarioResumoMes } from "./CalendarioResumoMes";

type Props = {
  ano: number;
  mes: number;
  concursoId: string | null;
};

export function CalendarioMensalWidget({ ano, mes, concursoId }: Props) {
  const { dias, resumo, isLoading } = useCalendarioMensal(ano, mes, concursoId);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
          <CalendarDays className="h-4 w-4" />
          Calendário do mês
        </h2>
        <Link
          to="/estudos/calendario"
          className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Ver completo
        </Link>
      </div>

        {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando calendário…</p>
      ) : (
        <>
          <CalendarioResumoMes resumo={resumo} compact />
          <div className="mt-3">
            <CalendarioMensalGrid ano={ano} mes={mes} dias={dias} />
          </div>
        </>
      )}
    </section>
  );
}
