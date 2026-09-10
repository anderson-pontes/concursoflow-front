import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type RevisaoPomodoroContext = {
  revisaoId: string;
  revisaoVersao: number;
  concursoId: string;
  disciplinaId: string;
  topicoId: string;
  idempotencyKey: string;
  returnTo: string;
};

type RevisaoPomodoroState = {
  context: RevisaoPomodoroContext | null;
  conflict: boolean;
  prepare: (context: Omit<RevisaoPomodoroContext, "idempotencyKey"> & { idempotencyKey?: string }) => void;
  markConflict: () => void;
  clear: () => void;
};

export const useRevisaoPomodoroStore = create<RevisaoPomodoroState>()(
  persist(
    (set) => ({
      context: null,
      conflict: false,
      prepare: (context) => set({
        context: {
          ...context,
          idempotencyKey: context.idempotencyKey || crypto.randomUUID(),
        },
        conflict: false,
      }),
      markConflict: () => set({ conflict: true }),
      clear: () => set({ context: null, conflict: false }),
    }),
    {
      name: "cf-revisao-pomodoro",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
