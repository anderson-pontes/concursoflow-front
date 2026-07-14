/**
 * Timer baseado em relógio de parede — imune a throttle de setInterval
 * em abas em segundo plano (Chrome/Firefox reduzem ticks para ~1/min).
 */

export type CountdownClock = {
  /** Segundos restantes quando pausado / no início do segmento. */
  remainingSeconds: number;
  /** Epoch ms em que o countdown zera; null = pausado. */
  deadlineAt: number | null;
};

export type StopwatchClock = {
  /** Segundos já acumulados antes do segmento atual. */
  elapsedSeconds: number;
  /** Epoch ms em que o segmento atual começou a correr; null = pausado. */
  runningStartedAt: number | null;
};

export type FocusClock = {
  accumulatedMs: number;
  runningSince: number | null;
};

export function getCountdownRemaining(clock: CountdownClock, now = Date.now()): number {
  if (clock.deadlineAt == null) return Math.max(0, Math.floor(clock.remainingSeconds));
  return Math.max(0, Math.ceil((clock.deadlineAt - now) / 1000));
}

export function armCountdown(remainingSeconds: number, now = Date.now()): CountdownClock {
  const remaining = Math.max(0, Math.floor(remainingSeconds));
  return {
    remainingSeconds: remaining,
    deadlineAt: remaining > 0 ? now + remaining * 1000 : now,
  };
}

export function pauseCountdown(clock: CountdownClock, now = Date.now()): CountdownClock {
  return {
    remainingSeconds: getCountdownRemaining(clock, now),
    deadlineAt: null,
  };
}

export function getStopwatchElapsed(clock: StopwatchClock, now = Date.now()): number {
  const base = Math.max(0, Math.floor(clock.elapsedSeconds));
  if (clock.runningStartedAt == null) return base;
  return base + Math.max(0, Math.floor((now - clock.runningStartedAt) / 1000));
}

export function armStopwatch(elapsedSeconds = 0, now = Date.now()): StopwatchClock {
  return {
    elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds)),
    runningStartedAt: now,
  };
}

export function pauseStopwatch(clock: StopwatchClock, now = Date.now()): StopwatchClock {
  return {
    elapsedSeconds: getStopwatchElapsed(clock, now),
    runningStartedAt: null,
  };
}

export function getFocusElapsedMs(clock: FocusClock, now = Date.now()): number {
  const base = Math.max(0, clock.accumulatedMs);
  if (clock.runningSince == null) return base;
  return base + Math.max(0, now - clock.runningSince);
}

export function armFocus(accumulatedMs = 0, now = Date.now()): FocusClock {
  return { accumulatedMs: Math.max(0, accumulatedMs), runningSince: now };
}

export function pauseFocus(clock: FocusClock, now = Date.now()): FocusClock {
  return { accumulatedMs: getFocusElapsedMs(clock, now), runningSince: null };
}

export function idleFocus(): FocusClock {
  return { accumulatedMs: 0, runningSince: null };
}
