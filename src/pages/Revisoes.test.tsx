import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Revisoes } from "@/pages/Revisoes";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const item = {
  id: "revisao-1",
  versao: 1,
  concurso_id: "concurso-a",
  disciplina_id: "disciplina-1",
  disciplina_nome: "Direito Constitucional",
  topico_id: "topico-1",
  topico_nome: "Poder Executivo",
  origem_tipo: "ciclo_topico" as const,
  origem_sessao_id: null,
  regra_versao: "v1",
  ciclo_indice: 0,
  intervalo_dias: 1,
  data_prevista_original: "2026-09-08",
  data_prevista_atual: "2026-09-08",
  timezone: "America/Sao_Paulo",
  status: "pendente" as const,
  ultima_transicao_em: "2026-09-08T09:30:00-03:00",
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderPage(initialEntry = "/revisoes") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/revisoes" element={<><Revisoes /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function page(items = [item], nextCursor: string | null = null) {
  return { grupo: "hoje", items, next_cursor: nextCursor, has_more: Boolean(nextCursor), limit: 20 };
}

describe("Revisoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useRevisaoPomodoroStore.setState({ context: null, conflict: false });
    useConcursoStore.setState({ concursoAtivoId: "concurso-a", contextResolved: true, contextError: false });
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === "/disciplinas") return Promise.resolve({ data: [{ id: "disciplina-1", nome: "Direito Constitucional" }] });
      if (url === "/concursos") return Promise.resolve({ data: [{ id: "concurso-a", nome: "TRT 8ª Região" }] });
      return Promise.resolve({ data: page() });
    }) as typeof api.get);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it("reflete o grupo na URL e carrega a fila do novo grupo", async () => {
    const user = userEvent.setup();
    renderPage("/revisoes?grupo=atrasadas");

    expect(await screen.findByText("Poder Executivo")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Atrasadas" })).toHaveAttribute("data-state", "active");
    await user.click(screen.getByRole("tab", { name: "Próximas" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("grupo=proximas"));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/revisoes", expect.objectContaining({
      params: expect.objectContaining({ concurso_id: "concurso-a", grupo: "proximas" }),
    })));
  });

  it("não consulta nem reaproveita fila quando não existe concurso ativo", () => {
    useConcursoStore.setState({ concursoAtivoId: null, contextResolved: true, contextError: false });
    renderPage();

    expect(screen.getByText("Escolha um concurso para revisar")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/revisoes", expect.anything());
    expect(api.get).not.toHaveBeenCalledWith("/disciplinas", expect.anything());
  });

  it("apresenta erro recuperável sem manter conteúdo anterior", async () => {
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === "/disciplinas") return Promise.resolve({ data: [] });
      if (url === "/concursos") return Promise.resolve({ data: [{ id: "concurso-a", nome: "TRT 8ª Região" }] });
      return Promise.reject(new Error("rede"));
    }) as typeof api.get);
    renderPage();

    expect(await screen.findByText("Não foi possível carregar as revisões")).toBeInTheDocument();
    expect(screen.queryByText("Poder Executivo")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("carrega a próxima página a partir do cursor", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url === "/disciplinas") return Promise.resolve({ data: [] }) as never;
      if (url === "/concursos") return Promise.resolve({ data: [{ id: "concurso-a", nome: "TRT 8ª Região" }] }) as never;
      const cursor = (config?.params as { cursor?: string } | undefined)?.cursor;
      return Promise.resolve({ data: cursor ? page([{ ...item, id: "revisao-2", topico_nome: "Poder Legislativo" }]) : page([item], "cursor-2") }) as never;
    });
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Poder Legislativo")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/revisoes", expect.objectContaining({
      params: expect.objectContaining({ cursor: "cursor-2" }),
    }));
  });

  it("abre a revisão no Pomodoro preservando concurso, versão e retorno", async () => {
    const user = userEvent.setup();
    renderPage("/revisoes?grupo=atrasadas");

    await user.click(await screen.findByRole("button", { name: "Iniciar revisão" }));

    const location = screen.getByTestId("location").textContent || "";
    expect(location).toContain("/pomodoro?from=revisao");
    expect(location).toContain("revisao_id=revisao-1");
    expect(location).toContain("revisao_versao=1");
    expect(location).toContain("concurso_id=concurso-a");
    expect(useRevisaoPomodoroStore.getState().context).toEqual(expect.objectContaining({
      revisaoId: "revisao-1",
      revisaoVersao: 1,
      concursoId: "concurso-a",
      idempotencyKey: expect.any(String),
      returnTo: "/revisoes?grupo=atrasadas",
    }));
  });

  it("confirma a ação destrutiva e envia uma chave idempotente", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Mais ações para Poder Executivo/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Ignorar revisão" }));
    expect(screen.getByRole("alertdialog", { name: "Ignorar esta revisão?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ignorar revisão" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/revisoes/revisao-1/ignorar",
      { versao_esperada: 1 },
      expect.objectContaining({
        params: { concurso_id: "concurso-a" },
        headers: { "Idempotency-Key": expect.any(String) },
      }),
    ));
  });

  it("exibe um conflito 409 de forma recuperável", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { detail: "Versão desatualizada" } },
    });
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Mais ações para Poder Executivo/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Ignorar revisão" }));
    await user.click(screen.getByRole("button", { name: "Ignorar revisão" }));

    expect(await screen.findByText("A revisão foi atualizada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atualizar revisão" })).toBeInTheDocument();
  });
});
