import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Pause, Play, Timer } from "lucide-react";

import { formatHHMMSS } from "@/lib/pomodoro/format";
import { formatTimerDisplay, getFocusTotalSeconds } from "@/lib/pomodoro/duration";
import { cn } from "@/lib/utils";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";

/** Barra compacta para retomar o timer quando o usuário está em outra página. */
export function PomodoroSessionBadge() {
  const location = useLocation();
  const hasSession = usePomodoroSessionStore((s) => s.hasSession);
  const isRunning = usePomodoroSessionStore((s) => s.isRunning);
  const timerKind = usePomodoroSessionStore((s) => s.timerKind);
  const phase = usePomodoroSessionStore((s) => s.phase);
  const cycleIndex = usePomodoroSessionStore((s) => s.cycleIndex);
  const clockTick = usePomodoroSessionStore((s) => s.clockTick);
  const sessionContext = usePomodoroSessionStore((s) => s.sessionContext);
  const pause = usePomodoroSessionStore((s) => s.pause);
  const resume = usePomodoroSessionStore((s) => s.resume);
  const getDisplayRemaining = usePomodoroSessionStore((s) => s.getDisplayRemaining);
  const getDisplayElapsed = usePomodoroSessionStore((s) => s.getDisplayElapsed);
  const focusHours = usePomodoroStore((s) => s.focusHours);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const mode = usePomodoroStore((s) => s.mode);

  void clockTick;
  if (!hasSession || location.pathname.startsWith("/pomodoro")) return null;

  const remaining = getDisplayRemaining();
  const elapsed = getDisplayElapsed();
  const label = timerKind === "stopwatch" ? formatHHMMSS(elapsed) : formatTimerDisplay(remaining);
  const phaseTotal = phase === "foco"
    ? getFocusTotalSeconds(focusHours, focusMinutes)
    : (mode === "pomodoro" && (cycleIndex + 1) % 4 === 0 ? longBreakMinutes : shortBreakMinutes) * 60;
  const progress = timerKind === "stopwatch"
    ? Math.min(1, elapsed / Math.max(1, phaseTotal))
    : Math.min(1, Math.max(0, 1 - remaining / Math.max(1, phaseTotal)));
  const status = !isRunning ? "Pausada" : phase === "pausa" ? "Pausa" : timerKind === "stopwatch" ? "Cronômetro" : "Foco";
  const contextLabel = sessionContext?.disciplinaNome || "Sessão de estudo";

  return (
    <div className="shrink-0 border-b border-border bg-surface px-4 py-2 md:px-6" data-testid="pomodoro-session-badge">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
        <div className="flex items-center gap-3">
          <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <Link to="/pomodoro" className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="block truncate text-sm font-semibold text-foreground">Sessão em andamento</span>
            <span className="block truncate text-xs text-muted-foreground">{contextLabel} · {status}</span>
          </Link>
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">{label}</span>
          <button type="button" onClick={() => (isRunning ? pause() : resume())} className="hidden shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex sm:items-center sm:gap-1" aria-label={isRunning ? "Pausar sessão" : "Retomar sessão"}>
            {isRunning ? <Pause className="h-3 w-3" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
            {isRunning ? "Pausar" : "Retomar"}
          </button>
          <Link to="/pomodoro" className="hidden shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">
            Voltar ao foco <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-label={`Progresso da fase: ${Math.round(progress * 100)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className={cn("h-full rounded-full bg-primary transition-[width]", isRunning && "duration-1000")} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
