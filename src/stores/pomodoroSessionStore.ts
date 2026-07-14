import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { PomodoroPhase } from "@/lib/pomodoro/theme";
import {
  armCountdown,
  armFocus,
  armStopwatch,
  getCountdownRemaining,
  getFocusElapsedMs,
  getStopwatchElapsed,
  idleFocus,
  pauseCountdown,
  pauseFocus,
  pauseStopwatch,
  type CountdownClock,
  type FocusClock,
  type StopwatchClock,
} from "@/lib/pomodoro/wallClock";

export type SessionTimerKind = "countdown" | "stopwatch";

export type PomodoroSessionState = {
  hasSession: boolean;
  isRunning: boolean;
  phase: PomodoroPhase;
  cycleIndex: number;
  timerKind: SessionTimerKind;
  countdown: CountdownClock;
  stopwatch: StopwatchClock;
  /** Tempo de foco líquido (pausa intencional não conta). */
  focusClock: FocusClock;
  /** Recorte desde o último save parcial. */
  partialClock: FocusClock;
  /** Epoch do primeiro start do bloco de foco atual (`inicio` na API). */
  sessionStartedAt: number | null;
  clockTick: number;

  getDisplayRemaining: (now?: number) => number;
  getDisplayElapsed: (now?: number) => number;
  getFocusSeconds: (now?: number) => number;
  getPartialSeconds: (now?: number) => number;

  bumpTick: () => void;
  startSession: (opts: { timerKind: SessionTimerKind; focusTotalSeconds: number }) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  enterBreak: (breakSeconds: number, nextCycleIndex: number) => void;
  enterFocus: (focusTotalSeconds: number) => void;
  afterPartialSave: (opts: { timerKind: SessionTimerKind; focusTotalSeconds: number }) => void;
};

const idleCountdown = (remaining: number): CountdownClock => ({
  remainingSeconds: remaining,
  deadlineAt: null,
});

const idleStopwatch = (): StopwatchClock => ({
  elapsedSeconds: 0,
  runningStartedAt: null,
});

export const usePomodoroSessionStore = create<PomodoroSessionState>()(
  persist(
    (set, get) => ({
      hasSession: false,
      isRunning: false,
      phase: "foco",
      cycleIndex: 0,
      timerKind: "countdown",
      countdown: idleCountdown(0),
      stopwatch: idleStopwatch(),
      focusClock: idleFocus(),
      partialClock: idleFocus(),
      sessionStartedAt: null,
      clockTick: 0,

      getDisplayRemaining: (now = Date.now()) => getCountdownRemaining(get().countdown, now),
      getDisplayElapsed: (now = Date.now()) => getStopwatchElapsed(get().stopwatch, now),
      getFocusSeconds: (now = Date.now()) => Math.max(1, Math.round(getFocusElapsedMs(get().focusClock, now) / 1000)),
      getPartialSeconds: (now = Date.now()) =>
        Math.max(1, Math.round(getFocusElapsedMs(get().partialClock, now) / 1000)),

      bumpTick: () => set((s) => ({ clockTick: s.clockTick + 1 })),

      startSession: ({ timerKind, focusTotalSeconds }) => {
        const now = Date.now();
        set({
          hasSession: true,
          isRunning: true,
          phase: "foco",
          cycleIndex: 0,
          timerKind,
          countdown: timerKind === "countdown" ? armCountdown(focusTotalSeconds, now) : idleCountdown(0),
          stopwatch: timerKind === "stopwatch" ? armStopwatch(0, now) : idleStopwatch(),
          focusClock: armFocus(0, now),
          partialClock: armFocus(0, now),
          sessionStartedAt: now,
          clockTick: get().clockTick + 1,
        });
      },

      pause: () => {
        const s = get();
        if (!s.hasSession || !s.isRunning) return;
        const now = Date.now();
        set({
          isRunning: false,
          countdown: pauseCountdown(s.countdown, now),
          stopwatch: pauseStopwatch(s.stopwatch, now),
          focusClock: s.phase === "foco" ? pauseFocus(s.focusClock, now) : s.focusClock,
          partialClock: s.phase === "foco" ? pauseFocus(s.partialClock, now) : s.partialClock,
          clockTick: s.clockTick + 1,
        });
      },

      resume: () => {
        const s = get();
        if (!s.hasSession || s.isRunning) return;
        const now = Date.now();
        const remaining = getCountdownRemaining(s.countdown, now);
        const elapsed = getStopwatchElapsed(s.stopwatch, now);
        // Countdown já em 0 = retry de auto-save: não rearma foco (evita inflar tempo parado)
        const rearmFocus = s.phase === "foco" && !(s.timerKind === "countdown" && remaining <= 0);
        set({
          isRunning: true,
          countdown: s.timerKind === "countdown" ? armCountdown(remaining, now) : s.countdown,
          stopwatch: s.timerKind === "stopwatch" ? armStopwatch(elapsed, now) : s.stopwatch,
          focusClock: rearmFocus ? armFocus(getFocusElapsedMs(s.focusClock, now), now) : s.focusClock,
          partialClock: rearmFocus ? armFocus(getFocusElapsedMs(s.partialClock, now), now) : s.partialClock,
          clockTick: s.clockTick + 1,
        });
      },

      reset: () =>
        set({
          hasSession: false,
          isRunning: false,
          phase: "foco",
          cycleIndex: 0,
          timerKind: "countdown",
          countdown: idleCountdown(0),
          stopwatch: idleStopwatch(),
          focusClock: idleFocus(),
          partialClock: idleFocus(),
          sessionStartedAt: null,
          clockTick: get().clockTick + 1,
        }),

      enterBreak: (breakSeconds, nextCycleIndex) => {
        const now = Date.now();
        set({
          hasSession: true,
          isRunning: true,
          phase: "pausa",
          cycleIndex: nextCycleIndex,
          timerKind: "countdown",
          countdown: armCountdown(breakSeconds, now),
          stopwatch: idleStopwatch(),
          focusClock: idleFocus(),
          partialClock: idleFocus(),
          sessionStartedAt: null,
          clockTick: get().clockTick + 1,
        });
      },

      enterFocus: (focusTotalSeconds) => {
        const now = Date.now();
        set({
          hasSession: true,
          isRunning: true,
          phase: "foco",
          timerKind: "countdown",
          countdown: armCountdown(focusTotalSeconds, now),
          stopwatch: idleStopwatch(),
          focusClock: armFocus(0, now),
          partialClock: armFocus(0, now),
          sessionStartedAt: now,
          clockTick: get().clockTick + 1,
        });
      },

      afterPartialSave: ({ timerKind, focusTotalSeconds }) => {
        const now = Date.now();
        const s = get();
        set({
          hasSession: true,
          isRunning: true,
          phase: "foco",
          timerKind,
          countdown: timerKind === "countdown" ? armCountdown(focusTotalSeconds, now) : idleCountdown(0),
          stopwatch: timerKind === "stopwatch" ? armStopwatch(0, now) : idleStopwatch(),
          focusClock: armFocus(0, now),
          partialClock: armFocus(0, now),
          sessionStartedAt: now,
          cycleIndex: s.cycleIndex,
          clockTick: s.clockTick + 1,
        });
      },
    }),
    {
      name: "cf-pomodoro-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        hasSession: s.hasSession,
        isRunning: s.isRunning,
        phase: s.phase,
        cycleIndex: s.cycleIndex,
        timerKind: s.timerKind,
        countdown: s.countdown,
        stopwatch: s.stopwatch,
        focusClock: s.focusClock,
        partialClock: s.partialClock,
        sessionStartedAt: s.sessionStartedAt,
      }),
    },
  ),
);
