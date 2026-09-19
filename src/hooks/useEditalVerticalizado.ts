import { useInfiniteQuery } from "@tanstack/react-query";
import { consultarEditalVerticalizado } from "@/services/editalVerticalizado";
import type { EditalConsulta } from "@/types/editalVerticalizado";

export function useEditalVerticalizado(concursoId: string, query: EditalConsulta) {
  return useInfiniteQuery({
    queryKey: ["edital-verticalizado", concursoId, query],
    queryFn: ({ pageParam, signal }) => consultarEditalVerticalizado(concursoId, query, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.has_more ? lastPage.page.next_cursor ?? undefined : undefined,
    enabled: Boolean(concursoId),
    staleTime: 30_000,
  });
}
