import { create } from "zustand";
import { persist } from "zustand/middleware";

type ConcursoStore = {
  /** ID do concurso selecionado globalmente (header + telas que filtram por concurso) */
  concursoAtivoId: string | null;
  setConcursoAtivoId: (id: string | null) => void;
};

export const useConcursoStore = create<ConcursoStore>()(
  persist(
    (set) => ({
      concursoAtivoId: null,
      setConcursoAtivoId: (id) => set({ concursoAtivoId: id }),
    }),
    {
      name: "cf-concurso-ativo",
      partialize: (state) => ({ concursoAtivoId: state.concursoAtivoId }),
    },
  ),
);
