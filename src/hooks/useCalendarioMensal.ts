import { useQuery } from "@tanstack/react-query";

import type { CalendarioDia, CalendarioMesResponse } from "@/lib/calendario/types";
import { fetchCalendarioMes } from "@/services/calendario";

export function useCalendarioMensal(ano: number, mes: number, concursoId: string | null) {
  const query = useQuery({
    queryKey: ["calendario", ano, mes, concursoId],
    queryFn: () => fetchCalendarioMes({ ano, mes, concursoId }),
    staleTime: 60_000,
  });

  const getDia = (data: string): CalendarioDia | undefined =>
    query.data?.dias.find((d) => d.data === data);

  return {
    ...query,
    calendario: query.data as CalendarioMesResponse | undefined,
    dias: query.data?.dias ?? [],
    resumo: query.data?.resumo_mes,
    getDia,
  };
}
