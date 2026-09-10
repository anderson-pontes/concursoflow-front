import { useInfiniteQuery } from "@tanstack/react-query";

import { revisoesKeys } from "@/lib/revisoes/queryKeys";
import { listarRevisoes } from "@/services/revisoes";
import type { RevisaoListFilters } from "@/types/revisao";

type UseRevisoesOptions = RevisaoListFilters & {
  concursoId: string | null;
  enabled?: boolean;
};

export function useRevisoes({ concursoId, enabled = true, ...filters }: UseRevisoesOptions) {
  return useInfiniteQuery({
    queryKey: revisoesKeys.list(concursoId || "", filters),
    queryFn: ({ pageParam }) => listarRevisoes({
      concursoId: concursoId!,
      ...filters,
      cursor: pageParam,
    }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.next_cursor || undefined : undefined,
    enabled: enabled && Boolean(concursoId),
    staleTime: 30_000,
  });
}
