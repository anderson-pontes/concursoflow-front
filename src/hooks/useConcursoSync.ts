import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";
import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";

type ConcursoRow = { id: string };

/** Garante concurso ativo válido na sessão autenticada — só após persist reidratar. */
export function useConcursoSync() {
  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const startContextResolution = useConcursoStore((s) => s.startContextResolution);
  const failContextResolution = useConcursoStore((s) => s.failContextResolution);
  const resolveConcursoContext = useConcursoStore((s) => s.resolveConcursoContext);
  const transitionConcurso = useConcursoContextTransition();
  const [hydrated, setHydrated] = useState(() => useConcursoStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useConcursoStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useConcursoStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    startContextResolution();
  }, [startContextResolution]);

  const { data: concursos, isError, isSuccess } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoRow[],
  });

  useEffect(() => {
    if (!hydrated) return;
    if (isError) {
      failContextResolution();
      return;
    }
    if (!isSuccess) return;

    const list = concursos ?? [];
    if (list.length === 0) {
      void transitionConcurso(null);
      return;
    }

    const stillExists = Boolean(concursoAtivoId && list.some((c) => c.id === concursoAtivoId));
    if (!stillExists) {
      void transitionConcurso(list[0].id);
      return;
    }
    resolveConcursoContext(concursoAtivoId);
  }, [
    hydrated,
    isError,
    isSuccess,
    concursos,
    concursoAtivoId,
    failContextResolution,
    resolveConcursoContext,
    transitionConcurso,
  ]);
}
