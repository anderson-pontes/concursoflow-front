import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completePomodoroCountdownPhase } from "@/hooks/usePomodoroSessionKeeper";
import { completePomodoroRevision } from "@/lib/revisoes/completePomodoroRevision";
import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

vi.mock("@/lib/revisoes/completePomodoroRevision", () => ({ completePomodoroRevision: vi.fn() }));
vi.mock("@/lib/pomodoro/sounds", () => ({ playBeep: vi.fn(), playCompletionSound: vi.fn() }));
vi.mock("@/services/api", () => ({ api: { post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("completePomodoroCountdownPhase em modo revisão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    usePomodoroStore.setState({
      mode: "livre",
      focusHours: 0,
      focusMinutes: 25,
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
    });
    usePomodoroSessionStore.setState({
      hasSession: true,
      isRunning: true,
      phase: "foco",
      cycleIndex: 0,
      timerKind: "countdown",
      countdown: { remainingSeconds: 0, deadlineAt: 100_000 },
      focusClock: { accumulatedMs: 50_000, runningSince: null },
      partialClock: { accumulatedMs: 50_000, runningSince: null },
      sessionStartedAt: 50_000,
    });
    useRevisaoPomodoroStore.setState({
      conflict: false,
      context: {
        revisaoId: "revisao-1",
        revisaoVersao: 2,
        concursoId: "concurso-1",
        disciplinaId: "disciplina-1",
        topicoId: "topico-1",
        idempotencyKey: "00000000-0000-4000-8000-000000000001",
        returnTo: "/revisoes",
      },
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("usa exclusivamente o comando auditável e não cria sessão comum duplicada", async () => {
    vi.mocked(completePomodoroRevision).mockResolvedValue("success");
    const queryClient = new QueryClient();

    await expect(completePomodoroCountdownPhase(queryClient)).resolves.toBe(true);

    expect(completePomodoroRevision).toHaveBeenCalledWith(queryClient, {
      inicio: new Date(50_000).toISOString(),
      fim: new Date(100_000).toISOString(),
      tempoEstudoSegundos: 50,
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(usePomodoroSessionStore.getState().hasSession).toBe(false);
  });

  it("encerra a sessão ao concluir automaticamente uma revisão em modo pomodoro", async () => {
    usePomodoroStore.setState({ mode: "pomodoro", cyclesTarget: 4 });
    vi.mocked(completePomodoroRevision).mockResolvedValue("success");
    const queryClient = new QueryClient();

    await expect(completePomodoroCountdownPhase(queryClient)).resolves.toBe(true);

    expect(completePomodoroRevision).toHaveBeenCalledOnce();
    expect(api.post).not.toHaveBeenCalled();
    expect(usePomodoroSessionStore.getState()).toMatchObject({
      hasSession: false,
      isRunning: false,
      phase: "foco",
      cycleIndex: 0,
      sessionStartedAt: null,
    });
  });
});
