import { create } from "zustand";
import { persist } from "zustand/middleware";

import { POMODORO_DEFAULTS } from "@/lib/pomodoro/constants";
import { clampFocusDuration } from "@/lib/pomodoro/duration";

export type PomodoroMode = "pomodoro" | "livre" | "cronometro";

type PomodoroState = {
  mode: PomodoroMode;
  focusHours: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesTarget: number;
  disciplinaId: string | null;
  topicoId: string | null;
  setMode: (mode: PomodoroMode) => void;
  setDisciplinaId: (id: string | null) => void;
  setTopicoId: (id: string | null) => void;
  setConfig: (
    cfg: Partial<Omit<PomodoroState, "setMode" | "setDisciplinaId" | "setTopicoId" | "setConfig">>,
  ) => void;
  setFocusDuration: (hours: number, minutes: number) => void;
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      mode: "pomodoro",
      focusHours: POMODORO_DEFAULTS.focusHours,
      focusMinutes: POMODORO_DEFAULTS.focusMinutes,
      shortBreakMinutes: POMODORO_DEFAULTS.shortBreakMinutes,
      longBreakMinutes: POMODORO_DEFAULTS.longBreakMinutes,
      cyclesTarget: POMODORO_DEFAULTS.cyclesTarget,
      disciplinaId: null,
      topicoId: null,
      setMode: (mode) => set({ mode }),
      setDisciplinaId: (disciplinaId) => set({ disciplinaId }),
      setTopicoId: (topicoId) => set({ topicoId }),
      setConfig: (cfg) => set((s) => ({ ...s, ...cfg })),
      setFocusDuration: (hours, minutes) => {
        const clamped = clampFocusDuration(hours, minutes);
        set({ focusHours: clamped.hours, focusMinutes: clamped.minutes });
      },
    }),
    {
      name: "cf-pomodoro",
      partialize: (s) => ({
        mode: s.mode,
        focusHours: s.focusHours,
        focusMinutes: s.focusMinutes,
        shortBreakMinutes: s.shortBreakMinutes,
        longBreakMinutes: s.longBreakMinutes,
        cyclesTarget: s.cyclesTarget,
        disciplinaId: s.disciplinaId,
        topicoId: s.topicoId,
      }),
      migrate: (persisted) => {
        const raw = persisted as Partial<PomodoroState> & { focusHours?: number };
        if (raw.focusHours === undefined) {
          return { ...raw, focusHours: 0 } as PomodoroState;
        }
        return persisted as PomodoroState;
      },
    },
  ),
);
