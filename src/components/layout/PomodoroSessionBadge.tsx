import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Timer } from "lucide-react";

import { formatHHMMSS } from "@/lib/pomodoro/format";
import { formatTimerDisplay } from "@/lib/pomodoro/duration";
import { cn } from "@/lib/utils";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";

/** Barra compacta para retomar o timer quando o usuário está em outra página. */
export function PomodoroSessionBadge() {
  const location = useLocation();
  const hasSession = usePomodoroSessionStore((s) => s.hasSession);
  const isRunning = usePomodoroSessionStore((s) => s.isRunning);
  const timerKind = usePomodoroSessionStore((s) => s.timerKind);
  const phase = usePomodoroSessionStore((s) => s.phase);
  const clockTick = usePomodoroSessionStore((s) => s.clockTick);
  const getDisplayRemaining = usePomodoroSessionStore((s) => s.getDisplayRemaining);
  const getDisplayElapsed = usePomodoroSessionStore((s) => s.getDisplayElapsed);

  void clockTick;

  if (!hasSession || location.pathname.startsWith("/pomodoro")) return null;

  const label =
    timerKind === "stopwatch"
      ? formatHHMMSS(getDisplayElapsed())
      : formatTimerDisplay(getDisplayRemaining());

  const status =
    !isRunning ? "Pausado" : phase === "pausa" ? "Pausa" : timerKind === "stopwatch" ? "Cronômetro" : "Foco";

  return (
    <div className="shrink-0 border-b border-border bg-surface px-4 py-2 md:px-6">
      <Link
        to="/pomodoro"
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2",
          "transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">
            Sessão ativa · {status}
            <span
              className={cn(
                "ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle",
                isRunning ? "animate-pulse bg-success" : "bg-muted-foreground",
              )}
            />
          </span>
        </span>
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">{label}</span>
      </Link>
    </div>
  );
}
