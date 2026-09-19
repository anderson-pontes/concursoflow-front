import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditalTopicActions } from "@/components/disciplinas/EditalTopicActions";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";
import type { TopicoEditalItem } from "@/types/editalVerticalizado";

const item: TopicoEditalItem = {
  id: "topico-1",
  disciplina_id: "disciplina-1",
  disciplina_nome: "Direito",
  descricao: "Constituicao",
  status: "revisao",
  numero_ordem: 1,
  peso: 2,
  dominio: 5,
  prioridade: 2,
  ultima_atividade_em: null,
  proxima_revisao_id: "revisao-1",
  proxima_revisao_versao: 3,
  proxima_revisao_em: "2026-09-20",
  revisao_atrasada: false,
  dias_atraso: 0,
  nunca_estudado: false,
  razoes_atencao: [],
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderActions(onRegister = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/disciplinas?view=edital"]}>
      <EditalTopicActions
        item={item}
        concursoId="concurso-1"
        concursoStatus="ativo"
        durationMinutes={50}
        returnTo="/disciplinas?view=edital"
        returnState={{ editalContestId: "concurso-1", editalSearch: "", editalPageCount: 1 }}
        onRegister={onRegister}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
  return onRegister;
}

describe("EditalTopicActions", () => {
  beforeEach(() => {
    usePomodoroSessionStore.getState().reset();
    useRevisaoPomodoroStore.getState().clear();
  });

  it("prepara a revisão auditável e navega sem iniciar o relógio", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: "Revisar" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/pomodoro?from=revisao");
    expect(screen.getByTestId("location")).toHaveTextContent("minutos=50");
    expect(useRevisaoPomodoroStore.getState().context).toMatchObject({
      revisaoId: "revisao-1",
      revisaoVersao: 3,
      concursoId: "concurso-1",
      returnTo: "/disciplinas?view=edital&expandida=topico-1",
    });
    expect(usePomodoroSessionStore.getState().hasSession).toBe(false);
  });

  it("preserva uma sessão pausada e oferece somente continuar ou permanecer", async () => {
    const user = userEvent.setup();
    usePomodoroSessionStore.getState().startSession({ timerKind: "countdown", focusTotalSeconds: 1500 });
    usePomodoroSessionStore.getState().pause();
    renderActions();

    await user.click(screen.getByRole("button", { name: "Revisar" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent("sessão em andamento");
    expect(screen.getByRole("button", { name: "Continuar sessão atual" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Permanecer no edital" })).toBeInTheDocument();
    expect(useRevisaoPomodoroStore.getState().context).toBeNull();
    expect(usePomodoroSessionStore.getState()).toMatchObject({ hasSession: true, isRunning: false });
  });
});
