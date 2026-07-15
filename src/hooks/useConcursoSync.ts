import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

type ConcursoRow = { id: string };

/** Garante concurso ativo válido na sessão autenticada — só após persist reidratar. */
export function useConcursoSync() {
  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);
  const [hydrated, setHydrated] = useState(() => useConcursoStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useConcursoStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useConcursoStore.persist.hasHydrated());
    return unsub;
  }, []);

  const { data: concursos, isFetched } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoRow[],
  });

  useEffect(() => {
    if (!hydrated || !isFetched) return;

    const list = concursos ?? [];
    if (list.length === 0) {
      if (concursoAtivoId !== null) setConcursoAtivoId(null);
      return;
    }

    const stillExists = Boolean(concursoAtivoId && list.some((c) => c.id === concursoAtivoId));
    if (!stillExists) {
      const fallback = list[0].id;
      if (concursoAtivoId !== fallback) setConcursoAtivoId(fallback);
    }
  }, [hydrated, isFetched, concursos, concursoAtivoId, setConcursoAtivoId]);
}
