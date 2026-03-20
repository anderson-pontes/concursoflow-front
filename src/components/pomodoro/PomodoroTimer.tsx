import React from "react";

import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";

type Phase = "foco" | "pausa";

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playBeep() {
  try {
    const AudioContextImpl = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextImpl();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    oscillator.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 250);
  } catch {
    // Sem som em ambientes sem audio.
  }
}

export function PomodoroTimer() {
  const {
    mode,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    cyclesTarget,
    disciplinaId,
  } = usePomodoroStore();

  const [isRunning, setIsRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("foco");
  const [cycleIndex, setCycleIndex] = React.useState(0);

  const [remainingSeconds, setRemainingSeconds] = React.useState(focusMinutes * 60);
  const focusStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isRunning && focusStartRef.current === null) {
      setRemainingSeconds(focusMinutes * 60);
    }
  }, [focusMinutes, isRunning]);

  const canStart = Boolean(disciplinaId);

  const reset = () => {
    setIsRunning(false);
    setPhase("foco");
    setCycleIndex(0);
    focusStartRef.current = null;
    setRemainingSeconds(focusMinutes * 60);
  };

  const recordFocusSession = async (pomodorosConcluidos: number) => {
    if (!disciplinaId || focusStartRef.current == null) return;
    const startMs = focusStartRef.current;
    const endMs = Date.now();
    const duracaoMinutos = Math.max(1, Math.round((endMs - startMs) / 60000));

    await api.post("/sessoes-estudo", {
      disciplina_id: disciplinaId,
      topico_id: null,
      inicio: new Date(startMs).toISOString(),
      fim: new Date(endMs).toISOString(),
      duracao_minutos: duracaoMinutos,
      tipo: mode === "pomodoro" ? "pomodoro" : "livre",
      pomodoros_concluidos: pomodorosConcluidos,
      anotacoes: null,
    });
  };

  const breakSeconds = React.useMemo(() => {
    if (mode !== "pomodoro") return shortBreakMinutes * 60;
    // Long break on every 4th completed focus.
    const nextCycleNumber = cycleIndex + 1;
    const useLong = nextCycleNumber % 4 === 0;
    return (useLong ? longBreakMinutes : shortBreakMinutes) * 60;
  }, [cycleIndex, longBreakMinutes, shortBreakMinutes, mode]);

  React.useEffect(() => {
    if (!isRunning) return;

    const tick = setInterval(() => {
      setRemainingSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [isRunning]);

  React.useEffect(() => {
    if (!isRunning) return;
    if (remainingSeconds > 0) return;

    playBeep();

    const handleFinish = async () => {
      if (phase === "foco") {
        await recordFocusSession(mode === "pomodoro" ? 1 : 0);
        focusStartRef.current = null;

        if (mode === "livre") {
          setIsRunning(false);
          setPhase("foco");
          setCycleIndex(0);
          setRemainingSeconds(focusMinutes * 60);
          return;
        }

        const nextCycleIndex = cycleIndex + 1;
        if (nextCycleIndex >= cyclesTarget) {
          setIsRunning(false);
          setPhase("foco");
          setCycleIndex(0);
          setRemainingSeconds(focusMinutes * 60);
          return;
        }

        setCycleIndex(nextCycleIndex);
        setPhase("pausa");
        setRemainingSeconds(breakSeconds);
        return;
      }

      // fim de pausa -> inicia novo foco
      setPhase("foco");
      setRemainingSeconds(focusMinutes * 60);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleFinish();
    // Note: remainingSeconds already hit 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isRunning, phase]);

  React.useEffect(() => {
    if (!isRunning) return;
    if (phase !== "foco") return;
    if (focusStartRef.current == null) focusStartRef.current = Date.now();
  }, [isRunning, phase]);

  const start = () => {
    if (!canStart) return;
    setIsRunning(true);
    setPhase("foco");
    setCycleIndex(0);
    focusStartRef.current = Date.now();
    setRemainingSeconds(focusMinutes * 60);
  };

  const startOrResume = () => {
    if (!canStart) return;
    if (isRunning) return;
    setIsRunning(true);
    if (phase === "foco" && focusStartRef.current == null) focusStartRef.current = Date.now();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              {mode === "pomodoro" ? "Pomodoro" : "Tempo Livre"} • {phase === "foco" ? "Foco" : "Pausa"}
            </div>
            {mode === "pomodoro" ? (
              <div className="text-xs text-muted-foreground">
                Ciclo {cycleIndex + 1}/{cyclesTarget}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Sessao unica</div>
            )}
          </div>
          <div className="rounded-md px-3 py-1 text-2xl font-mono text-warning-600 ring-2 ring-warning-600/30">
            {formatMMSS(remainingSeconds)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!isRunning ? (
            <button
              type="button"
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
              disabled={!canStart}
              onClick={start}
            >
              Iniciar
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted"
              onClick={() => setIsRunning(false)}
            >
              Pausar
            </button>
          )}

          {isRunning ? (
            <button
              type="button"
              className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted"
              onClick={reset}
            >
              Reset
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted disabled:opacity-60"
              disabled={!canStart}
              onClick={startOrResume}
            >
              Retomar
            </button>
          )}
        </div>
      </div>

      {!disciplinaId ? (
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-600">
          Selecione uma disciplina para registrar as sessoes.
        </div>
      ) : null}
    </div>
  );
}

