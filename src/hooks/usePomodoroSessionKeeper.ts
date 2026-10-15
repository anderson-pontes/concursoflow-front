import React from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
import { playBeep, playCompletionSound } from "@/lib/pomodoro/sounds";
import { getFocusTotalSeconds } from "@/lib/pomodoro/duration";
import { pauseFocus } from "@/lib/pomodoro/wallClock";
import { completePomodoroRevision } from "@/lib/revisoes/completePomodoroRevision";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

let completingPhase = false;

/**
 * Auto-salva sessÃ£o de foco e avanÃ§a fase (pausa / prÃ³ximo ciclo / fim).
 * Seguro para chamar fora da pÃ¡gina /pomodoro (aba ou rota diferente).
 * @returns true se a fase avanÃ§ou; false se abortou (ex.: falha no registro).
 */
export async function completePomodoroCountdownPhase(queryClient: QueryClient): Promise<boolean> {
  if (completingPhase) return false;

  const session = usePomodoroSessionStore.getState();
  const config = usePomodoroStore.getState();

  if (!session.hasSession || !session.isRunning || session.timerKind !== "countdown") return false;
  if (session.getDisplayRemaining() > 0) return false;

  completingPhase = true;
  try {
    const now = Date.now();
    // Congela imediatamente (countdown + foco) para o tick seguinte nÃ£o reentrar
    usePomodoroSessionStore.setState({
      isRunning: false,
      countdown: { remainingSeconds: 0, deadlineAt: null },
      focusClock: pauseFocus(session.focusClock, now),
      partialClock: pauseFocus(session.partialClock, now),
    });

    const focusTotalSeconds = getFocusTotalSeconds(config.focusHours, config.focusMinutes);
    const breakSeconds =
      config.mode === "pomodoro"
        ? ((session.cycleIndex + 1) % 4 === 0 ? config.longBreakMinutes : config.shortBreakMinutes) * 60
        : config.shortBreakMinutes * 60;

    if (session.phase === "foco") {
      playCompletionSound();
      const startMs = session.sessionStartedAt;
      const endMs = now;
      const focusSeconds = Math.max(
        1,
        Math.round(
          (pauseFocus(session.focusClock, endMs).accumulatedMs) / 1000,
        ),
      );

      // Sem disciplina/inÃ­cio nÃ£o hÃ¡ o que registrar â€” ainda assim encerra o bloco
      if (startMs && config.disciplinaId) {
        const duracaoMinutos = Math.max(1, Math.round(focusSeconds / 60));
        try {
          const revisaoContext = useRevisaoPomodoroStore.getState().context;
          if (revisaoContext) {
            const result = await completePomodoroRevision(queryClient, {
              inicio: new Date(startMs).toISOString(),
              fim: new Date(endMs).toISOString(),
              tempoEstudoSegundos: focusSeconds,
            });
            if (result !== "success") {
              toast.error(result === "conflict"
                ? "A revisÃ£o foi alterada. Volte Ã  Central para atualizar os dados."
                : "Erro ao concluir a revisÃ£o. Toque em Retomar para tentar novamente.");
              return false;
            }
            toast.success(`RevisÃ£o concluÃ­da (${duracaoMinutos} min).`);
            usePomodoroSessionStore.getState().reset();
            return true;
          } else {
            usePomodoroSessionStore.setState({ pendingRegistration: true });
            toast.info("SessÃ£o concluÃ­da. Revise os dados antes de salvar.");
            return false;
          }
        } catch {
          toast.error("Erro ao registrar sessÃ£o. Toque em Retomar para tentar novamente.");
          // MantÃ©m sessÃ£o pausada em 00:00 â€” Retomar dispara novo attempt via deadline
          return false;
        }
      }

      if (config.mode === "livre") {
        usePomodoroSessionStore.getState().reset();
        return true;
      }

      const next = session.cycleIndex + 1;
      if (next >= config.cyclesTarget) {
        usePomodoroSessionStore.getState().reset();
        toast.success("Todos os ciclos concluÃ­dos!");
        return true;
      }

      usePomodoroSessionStore.getState().enterBreak(breakSeconds, next);
      return true;
    }

    playBeep();
    usePomodoroSessionStore.getState().enterFocus(focusTotalSeconds);
    return true;
  } finally {
    completingPhase = false;
  }
}

/** Mantem o relogio vivo em qualquer rota autenticada e sincroniza ao voltar a aba. */
export function usePomodoroSessionKeeper() {
  const qc = useQueryClient();
  const hasSession = usePomodoroSessionStore((s) => s.hasSession);
  const isRunning = usePomodoroSessionStore((s) => s.isRunning);
  const timerKind = usePomodoroSessionStore((s) => s.timerKind);
  const bumpTick = usePomodoroSessionStore((s) => s.bumpTick);
  const getDisplayRemaining = usePomodoroSessionStore((s) => s.getDisplayRemaining);

  React.useEffect(() => {
    if (!hasSession) return;

    const sync = () => {
      bumpTick();
      if (isRunning && timerKind === "countdown" && getDisplayRemaining() <= 0) {
        void (async () => {
          const completingRevision = Boolean(useRevisaoPomodoroStore.getState().context);
          const advanced = await completePomodoroCountdownPhase(qc);
          if (!advanced) return;
          if (completingRevision) return;
          invalidateEstudosQueries(qc);
          const disciplinaId = usePomodoroStore.getState().disciplinaId;
          if (disciplinaId) {
            void qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
          }
        })();
      }
    };

    // Tick sÃ³ precisa refresh de UI enquanto corre; visibility/focus sempre sync (catch-up)
    const id = isRunning ? window.setInterval(sync, 1000) : undefined;
    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    sync();

    return () => {
      if (id != null) window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [hasSession, isRunning, timerKind, bumpTick, getDisplayRemaining, qc]);
}
