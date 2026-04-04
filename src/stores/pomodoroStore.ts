import { create } from "zustand";

export type PomodoroMode = "pomodoro" | "livre" | "cronometro";

type PomodoroState = {
  mode: PomodoroMode;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesTarget: number;

  disciplinaId: string | null;
  topicoId: string | null;

  setMode: (mode: PomodoroMode) => void;
  setDisciplinaId: (id: string | null) => void;
  setTopicoId: (id: string | null) => void;
  setConfig: (cfg: Partial<Omit<PomodoroState, "setMode" | "setDisciplinaId" | "setTopicoId" | "setConfig">>) => void;
};

export const usePomodoroStore = create<PomodoroState>((set) => ({
  mode: "pomodoro",
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesTarget: 4,

  disciplinaId: null,
  topicoId: null,

  setMode: (mode) => set({ mode }),
  setDisciplinaId: (disciplinaId) => set({ disciplinaId }),
  setTopicoId: (topicoId) => set({ topicoId }),
  setConfig: (cfg) =>
    set((s) => ({
      ...s,
      ...cfg,
    })),
}));
