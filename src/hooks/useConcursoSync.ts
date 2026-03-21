import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

type Concurso = { id: string; nome: string };

/**
 * Mantém `concursoAtivoId` válido (lista da API) sem UI.
 * Usado no layout autenticado para páginas que filtram por concurso.
 */
export function useConcursoSync() {
  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  useEffect(() => {
    if (concursos.length === 0) {
      setConcursoAtivoId(null);
      return;
    }
    const stillExists = concursos.some((c) => c.id === concursoAtivoId);
    if (!concursoAtivoId || !stillExists) setConcursoAtivoId(concursos[0].id);
  }, [concursos, concursoAtivoId, setConcursoAtivoId]);
}
