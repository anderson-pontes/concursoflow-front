import type { Query, QueryKey } from "@tanstack/react-query";

export type ConcursoContextStatus =
  | "hydrating"
  | "no_contest"
  | "no_disciplines"
  | "no_plan"
  | "empty_plan"
  | "ready"
  | "error";

export type ConcursoContextSnapshot = {
  resolved: boolean;
  concursoId: string | null;
  essentialError?: boolean;
  essentialLoading?: boolean;
  disciplinesLoaded?: boolean;
  disciplinesCount?: number;
  planLoaded?: boolean;
  plannedItemsCount?: number;
  actionableItemsCount?: number;
};

/** Precedência canônica dos estados contextuais compartilhados pelas páginas. */
export function resolveConcursoContextStatus(snapshot: ConcursoContextSnapshot): ConcursoContextStatus {
  if (!snapshot.resolved) return "hydrating";
  if (snapshot.essentialError) return "error";
  if (!snapshot.concursoId) return "no_contest";
  if (snapshot.essentialLoading) return "hydrating";
  if (snapshot.disciplinesLoaded && (snapshot.disciplinesCount ?? 0) === 0) return "no_disciplines";
  if (snapshot.planLoaded && (snapshot.plannedItemsCount ?? 0) === 0) return "no_plan";
  if (
    snapshot.planLoaded &&
    (snapshot.plannedItemsCount ?? 0) > 0 &&
    (snapshot.actionableItemsCount ?? 0) === 0
  ) return "empty_plan";
  return "ready";
}

const CONTEXTUAL_ROOTS = new Set([
  "dashboard-resumo",
  "dashboard",
  "cronograma-blocos",
  "calendario",
  "calendario-dia",
  "avisos-concurso",
  "concurso-disciplinas-progress",
  "disciplina-dashboard",
]);

/**
 * Contrato das chaves removidas na troca. Catálogos, concursos, notificações,
 * heatmap/histórico geral e estatísticas globais são preservados deliberadamente.
 */
export function isConcursoContextQueryKey(queryKey: QueryKey): boolean {
  const [root, scope] = queryKey;
  if (root === "disciplinas") return scope !== "catalog" && scope !== "catalogo-plano";
  return typeof root === "string" && CONTEXTUAL_ROOTS.has(root);
}

export function isConcursoContextQuery(query: Query): boolean {
  return isConcursoContextQueryKey(query.queryKey);
}
