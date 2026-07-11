import { useQuery } from "@tanstack/react-query";

import type { HistoricoFilters } from "@/lib/historico/types";
import { fetchHistoricoAgregado, fetchHistoricoSessoes } from "@/services/historicoEstudos";

export function useHistoricoSessoes(filters: HistoricoFilters, enabled = true) {
  return useQuery({
    queryKey: ["historico-sessoes", filters],
    queryFn: () => fetchHistoricoSessoes(filters),
    enabled: enabled && Boolean(filters.dataInicio && filters.dataFim),
    staleTime: 30_000,
  });
}

export function useHistoricoAgregado(
  params: {
    dataInicio: string;
    dataFim: string;
    agruparPor: string;
    concursoId: string | null;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ["historico-agregado", params],
    queryFn: () => fetchHistoricoAgregado(params),
    enabled: enabled && Boolean(params.dataInicio && params.dataFim),
    staleTime: 60_000,
  });
}
