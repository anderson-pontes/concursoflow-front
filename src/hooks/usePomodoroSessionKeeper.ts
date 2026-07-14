import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
import { playBeep, playCompletionSound } from "@/lib/pomodoro/sounds";
import { getFocusTotalSeconds } from "@/lib/pomodoro/duration";
import { pauseFocus } from "@/lib/pomodoro/wallClock";
import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";

let completingPhase = false;

/**
 * Auto-salva sessão de foco e avança fase (pausa / próximo ciclo / fim).
 * Seguro para chamar fora da página /pomodoro (aba ou rota diferente).
 * @returns true se a fase avançou; false se abortou (ex.: falha no registro).
 */
export async function completePomodoroCountdownPhase(): Promise<boolean> {
  if (completingPhase) return false;

  const session = usePomodoroSessionStore.getState();
  const config = usePomodoroStore.getState();

  if (!session.hasSession || !session.isRunning || session.timerKind !== "countdown") return false;
  if (session.getDisplayRemaining() > 0) return false;

  completingPhase = true;
  try {
    const now = Date.now();
    // Congela imediatamente (countdown + foco) para o tick seguinte não reentrar
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

      // Sem disciplina/início não há o que registrar — ainda assim encerra o bloco
      if (startMs && config.disciplinaId) {
        const duracaoMinutos = Math.max(1, Math.round(focusSeconds / 60));
        try {
          await api.post("/sessoes-estudo", {
            disciplina_id: config.disciplinaId,
            topico_id: config.topicoId || null,
            topico_ids: config.topicoId ? [config.topicoId] : [],
            inicio: new Date(startMs).toISOString(),
            fim: new Date(endMs).toISOString(),
            duracao_minutos: duracaoMinutos,
            tempo_estudo_segundos: focusSeconds,
            tipo: config.mode === "pomodoro" ? "pomodoro" : "livre",
            pomodoros_concluidos: config.mode === "pomodoro" ? 1 : 0,
            anotacoes: null,
          });
          toast.success(`Sessão registrada (${duracaoMinutos} min).`);
        } catch {
          toast.error("Erro ao registrar sessão. Toque em Retomar para tentar novamente.");
          // Mantém sessão pausada em 00:00 — Retomar dispara novo attempt via deadline
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
        toast.success("Todos os ciclos concluídos!");
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

/** Mantém o relógio vivo em qualquer rota autenticada + catch-up ao voltar à aba. */
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
          const advanced = await completePomodoroCountdownPhase();
          if (!advanced) return;
          invalidateEstudosQueries(qc);
          const disciplinaId = usePomodoroStore.getState().disciplinaId;
          if (disciplinaId) {
            void qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
          }
        })();
      }
    };

    // Tick só precisa refresh de UI enquanto corre; visibility/focus sempre sync (catch-up)
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
