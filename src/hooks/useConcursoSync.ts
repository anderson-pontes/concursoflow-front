import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

type ConcursoRow = { id: string };

/** Garante concurso ativo válido na sessão autenticada. */
export function useConcursoSync() {
  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoRow[],
  });

  useEffect(() => {
    if (concursos.length === 0) {
      setConcursoAtivoId(null);
      return;
    }
    const stillExists = concursoAtivoId && concursos.some((c) => c.id === concursoAtivoId);
    if (!concursoAtivoId || !stillExists) setConcursoAtivoId(concursos[0].id);
  }, [concursos, concursoAtivoId, setConcursoAtivoId]);
}
