import { create } from "zustand";

export type PomodoroMode = "pomodoro" | "livre";

type PomodoroState = {
  mode: PomodoroMode;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesTarget: number;

  disciplinaId: string | null;

  setMode: (mode: PomodoroMode) => void;
  setDisciplinaId: (id: string | null) => void;
  setConfig: (cfg: Partial<Omit<PomodoroState, "setMode" | "setDisciplinaId" | "setConfig">>) => void;
};

export const usePomodoroStore = create<PomodoroState>((set) => ({
  mode: "pomodoro",
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesTarget: 4,

  disciplinaId: null,

  setMode: (mode) => set({ mode }),
  setDisciplinaId: (disciplinaId) => set({ disciplinaId }),
  setConfig: (cfg) =>
    set((s) => ({
      ...s,
      ...cfg,
    })),
}));

