import type { QueryClient } from "@tanstack/react-query";

import type { RevisaoListFilters } from "@/types/revisao";

export const revisoesKeys = {
  all: ["revisoes"] as const,
  context: (concursoId: string) => ["revisoes", concursoId] as const,
  list: (concursoId: string, filters: RevisaoListFilters) => [
    "revisoes",
    concursoId,
    filters.grupo,
    filters.disciplinaId || null,
    filters.dataInicio || null,
    filters.dataFim || null,
  ] as const,
};

function hasConcursoId(value: unknown, concursoId: string): boolean {
  return Boolean(
    value
      && typeof value === "object"
      && "concursoId" in value
      && (value as { concursoId?: unknown }).concursoId === concursoId,
  );
}

export async function invalidateRevisaoContext(queryClient: QueryClient, concursoId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: revisoesKeys.context(concursoId) }),
    queryClient.invalidateQueries({ queryKey: ["dashboard", "revisoes-pendentes", concursoId] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-resumo", concursoId] }),
    queryClient.invalidateQueries({ queryKey: ["edital-verticalizado", concursoId] }),
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [root, params] = query.queryKey;
        return (root === "historico-sessoes" || root === "historico-agregado")
          && hasConcursoId(params, concursoId);
      },
    }),
  ]);
}
