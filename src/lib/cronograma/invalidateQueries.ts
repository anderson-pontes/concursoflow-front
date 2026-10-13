import type { QueryClient } from "@tanstack/react-query";

/** Atualiza todas as projeções compartilhadas após alterar planejamento. */
export function invalidateCronogramaQueries(client: QueryClient) {
  for (const key of ["cronograma-planejamento", "cronograma-resumo", "cronograma-blocos", "cronograma-atividades", "calendario", "calendario-dia", "dashboard", "dashboard-resumo", "dashboard-heatmap", "disciplinas", "disciplina-dashboard", "historico-sessoes", "historico-agregado"]) {
    void client.invalidateQueries({ queryKey: [key] });
  }
}
