import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isConcursoContextQuery } from "@/lib/concursos/context";
import { trackTelemetry } from "@/services/telemetry";
import { useConcursoStore } from "@/stores/concursoStore";

let transitionVersion = 0;

/** Troca atômica: oculta UI, cancela/remove cache contextual e publica somente a seleção mais recente. */
export function useConcursoContextTransition() {
  const queryClient = useQueryClient();
  const startContextResolution = useConcursoStore((state) => state.startContextResolution);
  const resolveConcursoContext = useConcursoStore((state) => state.resolveConcursoContext);
  return React.useCallback(async (
    nextConcursoId: string | null,
    source?: "sidebar" | "catalog" | "settings",
  ) => {
    const previousConcursoId = useConcursoStore.getState().concursoAtivoId;
    const version = ++transitionVersion;
    startContextResolution();
    await queryClient.cancelQueries({ predicate: isConcursoContextQuery });
    if (version !== transitionVersion) return false;
    queryClient.removeQueries({ predicate: isConcursoContextQuery });
    resolveConcursoContext(nextConcursoId);
    if (source && previousConcursoId !== nextConcursoId) {
      trackTelemetry("contest_context_changed", {
        source,
        previous_state: previousConcursoId ? "active" : "none",
        next_state: nextConcursoId ? "active" : "none",
      });
    }
    return true;
  }, [queryClient, resolveConcursoContext, startContextResolution]);
}
