import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/pages/Dashboard";
import { Cronograma } from "@/pages/Cronograma";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(async () => ({ data: [] })),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderWithApp(ui: React.ReactNode, queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("isolamento sem concurso ativo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    useConcursoStore.setState({
      concursoAtivoId: null,
      contextResolved: true,
      contextError: false,
    });
  });

  it("mantém o dashboard neutro durante a resolução do contexto", () => {
    useConcursoStore.setState({ contextResolved: false });

    renderWithApp(<Dashboard />);

    expect(screen.getByRole("status", { name: /carregando conteúdo/i })).toBeInTheDocument();
    expect(screen.queryByText(/escolha o concurso que vai orientar/i)).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/dashboard/resumo", expect.anything());
    expect(api.get).not.toHaveBeenCalledWith("/cronograma/blocos", expect.anything());
  });

  it("não renderiza dados contextuais em cache no dashboard sem concurso", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["disciplinas", "dashboard", null], [
      { id: "legacy", nome: "Disciplina legada" },
    ]);
    queryClient.setQueryData(["cronograma-blocos", null], [
      { id: "legacy-block", disciplina_id: "legacy", dia_semana: "seg" },
    ]);

    renderWithApp(<Dashboard />, queryClient);

    expect(screen.getByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escolher edital" })).toHaveAttribute("href", "/planos/novo?origem=catalogo");
    expect(screen.getByRole("link", { name: "Cadastrar manualmente" })).toHaveAttribute(
      "href",
      "/concursos?novo=manual",
    );
    expect(screen.queryByText("Disciplina legada")).not.toBeInTheDocument();
    expect(screen.queryByText("Cronograma da semana")).not.toBeInTheDocument();
  });

  it("bloqueia consultas e ações do cronograma sem concurso", () => {
    renderWithApp(<Cronograma />);

    expect(screen.getByRole("heading", { level: 1, name: "Cronograma" })).toBeInTheDocument();
    expect(screen.getByText(/escolha um concurso antes de planejar/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agendado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mais ações/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /criar cronograma/i })).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("diferencia falha ao resolver o contexto de uma conta sem concursos", () => {
    useConcursoStore.setState({ contextError: true });

    renderWithApp(<Dashboard />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o concurso ativo",
    );
    expect(screen.queryByRole("link", { name: "Escolher edital" })).not.toBeInTheDocument();
  });

  it("oculta cache aquecido em erro e permite tentar novamente", async () => {
    useConcursoStore.setState({
      concursoAtivoId: "concurso-a",
      contextResolved: true,
      contextError: false,
    });
    vi.mocked(api.get).mockRejectedValue(new Error("rede indisponível"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["disciplinas", "dashboard", "concurso-a"], [
      { id: "legacy", nome: "Disciplina residual" },
    ]);

    renderWithApp(<Dashboard />, queryClient);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o concurso ativo",
    );
    expect(screen.queryByText("Disciplina residual")).not.toBeInTheDocument();
    const callsBeforeRetry = vi.mocked(api.get).mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(callsBeforeRetry));
  });
});
