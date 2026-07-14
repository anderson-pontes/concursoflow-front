import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, RotateCcw, Save, StopCircle, Minimize2 } from "lucide-react";

import { CircularArc } from "@/components/pomodoro/CircularArc";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import type { RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";
import { MODE_LABELS } from "@/lib/pomodoro/constants";
import {
  formatFocusDurationLabel,
  formatTimerDisplay,
  getFocusTotalSeconds,
} from "@/lib/pomodoro/duration";
import { formatHHMMSS } from "@/lib/pomodoro/format";
import { getPomodoroTheme } from "@/lib/pomodoro/theme";
import { cn } from "@/lib/utils";
import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";
import { Button } from "@/components/ui/button";

type TopicoOpt = { id: string; descricao: string };

type RegistroSnapshot = {
  duracaoSegundos: number;
  topicoDefaultList: RegistroDefaultTopico[] | null;
  isPartial: boolean;
};

type PomodoroTimerProps = {
  onActiveChange?: (active: boolean) => void;
  disciplinaNome?: string;
  topicoNome?: string;
};

export function PomodoroTimer({ onActiveChange, disciplinaNome, topicoNome }: PomodoroTimerProps) {
  const {
    mode,
    focusHours,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    cyclesTarget,
    disciplinaId,
    topicoId,
  } = usePomodoroStore();

  const focusTotalSeconds = getFocusTotalSeconds(focusHours, focusMinutes);
  const isCronometro = mode === "cronometro";
  const timerKind = isCronometro ? "stopwatch" : "countdown";

  const qc = useQueryClient();

  const hasSession = usePomodoroSessionStore((s) => s.hasSession);
  const isRunning = usePomodoroSessionStore((s) => s.isRunning);
  const phase = usePomodoroSessionStore((s) => s.phase);
  const cycleIndex = usePomodoroSessionStore((s) => s.cycleIndex);
  const clockTick = usePomodoroSessionStore((s) => s.clockTick);
  const startSession = usePomodoroSessionStore((s) => s.startSession);
  const pause = usePomodoroSessionStore((s) => s.pause);
  const resumeSession = usePomodoroSessionStore((s) => s.resume);
  const resetSession = usePomodoroSessionStore((s) => s.reset);
  const afterPartialSave = usePomodoroSessionStore((s) => s.afterPartialSave);
  const getDisplayRemaining = usePomodoroSessionStore((s) => s.getDisplayRemaining);
  const getDisplayElapsed = usePomodoroSessionStore((s) => s.getDisplayElapsed);
  const getPartialSeconds = usePomodoroSessionStore((s) => s.getPartialSeconds);

  const [immersive, setImmersive] = React.useState(false);
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroSnapshot, setRegistroSnapshot] = React.useState<RegistroSnapshot | null>(null);

  const canStart = Boolean(disciplinaId);
  const isActive = hasSession;

  // Lê wall-clock a cada tick (e nos renders)
  void clockTick;
  const remainingSeconds = getDisplayRemaining();
  const elapsedSeconds = getDisplayElapsed();

  React.useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  React.useEffect(() => {
    if (isActive) setImmersive(true);
  }, [isActive]);

  const { data: topicos } = useQuery({
    queryKey: ["pomodoro-topicos-timer", disciplinaId],
    enabled: Boolean(disciplinaId),
    queryFn: async () => {
      const res = await api.get(`/disciplinas/${disciplinaId}/topicos`);
      return (res.data as TopicoOpt[]).map((t) => ({
        id: String(t.id),
        descricao: t.descricao,
      }));
    },
  });

  const topicoDefaultList = React.useMemo<RegistroDefaultTopico[] | null>(() => {
    if (!topicoId) return null;
    const found = topicos?.find((t) => t.id === topicoId);
    return [{ id: topicoId, nome: found?.descricao ?? topicoNome ?? "" }];
  }, [topicoId, topicos, topicoNome]);

  // Mudança de modo invalida a sessão em andamento (duração pode mudar via config sem derrubar)
  const prevModeRef = React.useRef(mode);
  React.useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = mode;
    if (prev === mode) return;
    if (hasSession) resetSession();
  }, [mode, hasSession, resetSession]);

  const breakSeconds = React.useMemo(() => {
    if (mode !== "pomodoro") return shortBreakMinutes * 60;
    return ((cycleIndex + 1) % 4 === 0 ? longBreakMinutes : shortBreakMinutes) * 60;
  }, [cycleIndex, longBreakMinutes, shortBreakMinutes, mode]);

  const start = () => {
    if (!canStart) return;
    startSession({ timerKind, focusTotalSeconds });
    setImmersive(true);
  };

  const resume = () => {
    if (!canStart || isRunning) return;
    resumeSession();
  };

  const confirmReset = () => {
    if (!hasSession) return;
    if (window.confirm("Cancelar a sessão atual? O tempo não será salvo automaticamente.")) {
      resetSession();
      setImmersive(false);
    }
  };

  const openModalWithSnapshot = React.useCallback(
    (isPartial: boolean) => {
      if (!disciplinaId || !hasSession || phase !== "foco") return;
      const duracaoSegundos = getPartialSeconds();
      pause();
      setRegistroSnapshot({ duracaoSegundos, topicoDefaultList, isPartial });
      setRegistroOpen(true);
    },
    [disciplinaId, hasSession, phase, getPartialSeconds, pause, topicoDefaultList],
  );

  const handleModalSaved = React.useCallback(() => {
    setRegistroOpen(false);
    qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
    invalidateEstudosQueries(qc);
    if (registroSnapshot?.isPartial) {
      afterPartialSave({ timerKind, focusTotalSeconds });
      setRegistroSnapshot(null);
    } else {
      resetSession();
      setImmersive(false);
      setRegistroSnapshot(null);
    }
  }, [registroSnapshot, timerKind, focusTotalSeconds, disciplinaId, qc, afterPartialSave, resetSession]);

  const arcProgress = React.useMemo(() => {
    if (isCronometro) {
      const cycle = Math.max(focusTotalSeconds, 60);
      return (elapsedSeconds % cycle) / cycle;
    }
    if (phase === "foco") return 1 - remainingSeconds / Math.max(focusTotalSeconds, 1);
    const breakTotal = mode === "pomodoro" ? breakSeconds : shortBreakMinutes * 60;
    return 1 - remainingSeconds / Math.max(breakTotal, 1);
  }, [
    isCronometro,
    elapsedSeconds,
    focusTotalSeconds,
    phase,
    remainingSeconds,
    breakSeconds,
    shortBreakMinutes,
    mode,
  ]);

  const theme = getPomodoroTheme(phase, isCronometro);
  const displayTime = isCronometro ? formatHHMMSS(elapsedSeconds) : formatTimerDisplay(remainingSeconds);
  const idleTime = isCronometro ? "00:00" : formatTimerDisplay(focusTotalSeconds);

  React.useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      e.preventDefault();
      if (isRunning) pause();
      else resume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, isRunning, pause, resume]);

  const contextLabel = [disciplinaNome, topicoNome].filter(Boolean).join(" · ");

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border transition-all duration-300",
          theme.shell,
          isActive && immersive
            ? "min-h-[min(68dvh,600px)] border-primary/30 shadow-2xl shadow-primary/10"
            : "border-border shadow-sm",
        )}
      >
        <div className={cn("pointer-events-none absolute inset-0", theme.glow)} />
        <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
          <div
            className={cn("h-full transition-all duration-700 ease-out", theme.topBar)}
            style={{ width: `${arcProgress * 100}%` }}
          />
        </div>

        {isActive ? (
          <div className="relative flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isRunning ? "animate-pulse bg-success shadow-[0_0_8px_var(--success)]" : "bg-white/30",
                )}
              />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                {isRunning ? "Ao vivo" : "Pausado"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mode === "pomodoro" && !isCronometro ? (
                <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold tracking-wide", theme.chip)}>
                  Ciclo {cycleIndex + 1}/{cyclesTarget}
                </span>
              ) : null}
              <button
                type="button"
                title="Recolher painel"
                aria-label="Recolher painel"
                onClick={() => setImmersive(false)}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="relative flex flex-col items-center px-6 pb-8 pt-10">
          {!isActive ? (
            <span className={cn("mb-8 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest", theme.chip)}>
              {MODE_LABELS[mode]}
            </span>
          ) : null}

          {contextLabel ? (
            <p className="mb-6 max-w-sm truncate text-center text-sm font-medium text-white/50">{contextLabel}</p>
          ) : null}

          <div className="relative mx-auto h-[240px] w-[240px] sm:h-[260px] sm:w-[260px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <CircularArc
                progress={isActive ? arcProgress : 0}
                size={260}
                stroke={11}
                className={theme.arc}
              />
            </div>
            <div className={cn("absolute inset-4 rounded-full border sm:inset-5", theme.ring)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-black tracking-tight text-white sm:text-6xl">
                {isActive ? displayTime : idleTime}
              </span>
              <span className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                {isActive
                  ? isCronometro
                    ? "Tempo decorrido"
                    : phase === "foco"
                      ? "Tempo restante"
                      : "Em pausa"
                  : isCronometro
                    ? "Pronto para iniciar"
                    : formatFocusDurationLabel(focusHours, focusMinutes)}
              </span>
            </div>
          </div>

          {isActive ? (
            <div className="mt-6 text-center">
              <p className={cn("text-lg font-bold uppercase tracking-[0.15em]", theme.accent)}>{theme.modeLabel}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/35">{theme.subLabel}</p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {!isActive ? (
              !canStart ? (
                <p className="text-center text-sm text-amber-300/90">Selecione uma disciplina para iniciar</p>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={start}
                  className="h-12 gap-2 rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-700"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Iniciar sessão
                </Button>
              )
            ) : isRunning ? (
              <>
                <button
                  type="button"
                  title="Pausar (espaço)"
                  aria-label="Pausar (espaço)"
                  onClick={() => pause()}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-transform hover:scale-105"
                >
                  <Pause className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  title="Salvar parcial"
                  aria-label="Salvar parcial"
                  onClick={() => openModalWithSnapshot(true)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 backdrop-blur-sm transition-transform hover:scale-105",
                    theme.accentSoft,
                  )}
                >
                  <Save className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openModalWithSnapshot(false)}
                  className="flex h-14 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-neutral-900 shadow-lg transition-transform hover:scale-105"
                >
                  <StopCircle className="h-5 w-5" />
                  Encerrar e salvar
                </button>
                <button
                  type="button"
                  title="Cancelar sessão"
                  aria-label="Cancelar sessão"
                  onClick={confirmReset}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-transform hover:scale-105 hover:text-white/80"
                >
                  <Square className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  title="Retomar (espaço)"
                  aria-label="Retomar (espaço)"
                  onClick={resume}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-105"
                >
                  <Play className="h-7 w-7 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => openModalWithSnapshot(false)}
                  className="flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-transform hover:scale-105"
                >
                  <StopCircle className="h-4 w-4" />
                  Encerrar e salvar
                </button>
                <button
                  type="button"
                  title="Reiniciar"
                  aria-label="Reiniciar"
                  onClick={confirmReset}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-transform hover:scale-105"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {isActive ? (
            <p className="mt-6 text-[11px] text-white/30">Atalho: barra de espaço para pausar/retomar</p>
          ) : null}
        </div>
      </div>

      <RegistroEstudoModal
        open={registroOpen}
        onClose={() => {
          setRegistroOpen(false);
          setRegistroSnapshot(null);
        }}
        defaultDisciplinaId={disciplinaId}
        defaultTopicos={registroSnapshot?.topicoDefaultList ?? null}
        defaultDuracaoSegundos={registroSnapshot?.duracaoSegundos ?? null}
        onSaved={handleModalSaved}
      />
    </>
  );
}
