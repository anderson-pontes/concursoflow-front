import { create } from "zustand";
import { persist } from "zustand/middleware";

type ConcursoStoreState = {
  concursoAtivoId: string | null;
  setConcursoAtivoId: (id: string | null) => void;
};

export const useConcursoStore = create<ConcursoStoreState>()(
  persist(
    (set) => ({
      concursoAtivoId: null,
      setConcursoAtivoId: (id) => set({ concursoAtivoId: id }),
    }),
    { name: "cf-concurso-ativo" },
  ),
);

export function useConcursoAtivoId() {
  return useConcursoStore((s) => s.concursoAtivoId);
}
