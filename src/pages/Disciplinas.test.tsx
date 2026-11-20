import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { Disciplinas } from "@/pages/Disciplinas";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));

function setup(path = "/disciplinas") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[path]}><Disciplinas /></MemoryRouter>
  </QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: { id: "usuario-1" } as AuthUser });
  useConcursoStore.getState().resolveConcursoContext("concurso-1");
  vi.mocked(api.get).mockImplementation(async (url) => ({ data: url === "/concursos"
    ? [{ id: "concurso-1", nome: "Edital", orgao: "Órgão", cargo: "Analista" }]
    : { items: [], total: 0, page: 1, total_pages: 0, summary: { total: 0 } } }));
});

it("consulta apenas vínculos do concurso ativo e restaura a visualização por usuário", async () => {
  const first = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Vista em tabela" }));
  expect(api.get).toHaveBeenCalledWith("/disciplinas/paginadas", expect.objectContaining({
    params: expect.objectContaining({ concurso_id: "concurso-1", vinculo: "concurso" }),
  }));
  first.unmount();

  const second = setup("/disciplinas?view=cards");
  expect(await screen.findByRole("button", { name: "Vista em tabela" })).toHaveAttribute("aria-pressed", "true");
  second.unmount();

  useAuthStore.setState({ user: { id: "usuario-2" } as AuthUser });
  setup();
  expect(await screen.findByRole("button", { name: "Vista em cards" })).toHaveAttribute("aria-pressed", "true");
});

it("só consulta o catálogo sem concurso após seleção explícita", async () => {
  useConcursoStore.getState().resolveConcursoContext(null);
  setup();
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Todos os concursos" }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/disciplinas/paginadas", expect.objectContaining({
    params: { page: 1, page_size: 9 },
  })));
  expect(useConcursoStore.getState().concursoAtivoId).toBeNull();
});
