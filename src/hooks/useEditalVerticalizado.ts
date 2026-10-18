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
    // Keep the search input mounted while refining the current contest. Never
    // carry another contest's results into the newly selected context.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === concursoId ? previous : undefined,
    staleTime: 30_000,
  });
}
