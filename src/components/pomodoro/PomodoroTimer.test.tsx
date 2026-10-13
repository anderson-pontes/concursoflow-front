import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";

vi.mock("@/components/estudos/RegistroEstudoModal", () => ({
  RegistroEstudoModal: ({ open }: { open: boolean }) => open
    ? <div role="dialog" aria-label="Registro de estudo" />
    : null,
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

function renderTimer(compact = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PomodoroTimer compact={compact} disciplinaNome="Direito" topicoNome="Constituição" />
    </QueryClientProvider>,
  );
}

describe("PomodoroTimer durante a pausa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    usePomodoroStore.setState({
      mode: "pomodoro",
      focusHours: 0,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesTarget: 4,
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
    });
    usePomodoroSessionStore.setState({
      hasSession: true,
      isRunning: true,
      phase: "pausa",
      cycleIndex: 1,
      timerKind: "countdown",
      countdown: { remainingSeconds: 300, deadlineAt: Date.now() + 300_000 },
      stopwatch: { elapsedSeconds: 0, runningStartedAt: null },
      focusClock: { accumulatedMs: 0, runningSince: null },
      partialClock: { accumulatedMs: 0, runningSince: null },
      sessionStartedAt: null,
    });
  });

  it("preserva sessão e vínculo ao alternar entre cronograma compacto e Pomodoro", () => {
    const context = { disciplinaId: "disciplina-1", concursoId: "concurso-1", itemId: "atividade-1", dataReferencia: "2026-10-11" };
    usePomodoroStore.setState({ activityContext: context });
    const deadline = usePomodoroSessionStore.getState().countdown.deadlineAt;
    const first = renderTimer(true);
    expect(screen.getByRole("heading", { name: "Cronômetro de estudo" })).toBeInTheDocument();
    first.unmount();
    renderTimer();
    expect(usePomodoroSessionStore.getState().hasSession).toBe(true);
    expect(usePomodoroSessionStore.getState().countdown.deadlineAt).toBe(deadline);
    expect(usePomodoroStore.getState().activityContext).toEqual(context);
  });

  it("encerra o ciclo com confirmação sem abrir registro de estudo", async () => {
    const user = userEvent.setup();
    renderTimer();

    await user.click(screen.getByRole("button", { name: "Encerrar pausa" }));
    expect(screen.getByRole("alertdialog", { name: "Encerrar a pausa atual?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Encerrar ciclo" }));

    await waitFor(() => expect(usePomodoroSessionStore.getState().hasSession).toBe(false));
    expect(screen.queryByRole("dialog", { name: /registrar estudo/i })).not.toBeInTheDocument();
  });

  it("mantém o encerramento com salvamento quando o foco foi pausado manualmente", async () => {
    usePomodoroSessionStore.setState({
      isRunning: false,
      phase: "foco",
      countdown: { remainingSeconds: 600, deadlineAt: null },
      focusClock: { accumulatedMs: 900_000, runningSince: null },
      partialClock: { accumulatedMs: 900_000, runningSince: null },
      sessionStartedAt: Date.now() - 900_000,
    });
    const user = userEvent.setup();
    renderTimer();

    await user.click(screen.getByRole("button", { name: "Encerrar e salvar" }));

    expect(screen.getByRole("dialog", { name: "Registro de estudo" })).toBeInTheDocument();
  });
});
