import { create } from "zustand";
import { persist } from "zustand/middleware";

type ConcursoStoreState = {
  concursoAtivoId: string | null;
  contextResolved: boolean;
  contextError: boolean;
  startContextResolution: () => void;
  failContextResolution: () => void;
  resolveConcursoContext: (id: string | null) => void;
};

export const useConcursoStore = create<ConcursoStoreState>()(
  persist(
    (set) => ({
      concursoAtivoId: null,
      contextResolved: false,
      contextError: false,
      startContextResolution: () => set({ contextResolved: false, contextError: false }),
      failContextResolution: () => set({ contextResolved: true, contextError: true }),
      resolveConcursoContext: (id) => set({
        concursoAtivoId: id,
        contextResolved: true,
        contextError: false,
      }),
    }),
    {
      name: "cf-concurso-ativo",
      partialize: (state) => ({ concursoAtivoId: state.concursoAtivoId }),
    },
  ),
);

export function useConcursoAtivoId() {
  return useConcursoStore((s) => s.concursoAtivoId);
}

export function useConcursoContextResolved() {
  return useConcursoStore((s) => s.contextResolved);
}

export function useConcursoContextError() {
  return useConcursoStore((s) => s.contextError);
}
