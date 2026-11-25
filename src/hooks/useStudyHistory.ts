import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import type { StudyHistoryFilters, StudyHistoryOrder } from "@/lib/historico/types";
import { fetchStudyHistory, fetchStudyHistorySummary } from "@/services/historicoEstudos";

export function useStudyHistory(filters: StudyHistoryFilters, order: StudyHistoryOrder) {
  const userId = useAuthStore((state) => state.user?.id);
  const context = { concursoId: filters.concurso_id, userId };
  const history = useInfiniteQuery({
    queryKey: ["historico-sessoes", context, "cursor", filters, order],
    queryFn: ({ pageParam, signal }) => fetchStudyHistory(filters, order, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: ({ next_cursor }) => next_cursor ?? undefined,
    staleTime: 30_000,
  });
  const summary = useQuery({
    queryKey: ["historico-sessoes", context, "resumo", filters],
    queryFn: ({ signal }) => fetchStudyHistorySummary(filters, signal),
    staleTime: 30_000,
  });
  return { history, summary };
}
