import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GestaoUsuarios } from "@/pages/admin/GestaoUsuarios";
import { fetchUsers, fetchUsersDashboard } from "@/services/adminUsers";

vi.mock("@/services/adminUsers", () => ({
  fetchUsers: vi.fn(),
  fetchUsersDashboard: vi.fn(),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <GestaoUsuarios />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GestaoUsuarios", () => {
  beforeEach(() => {
    vi.mocked(fetchUsersDashboard).mockResolvedValue({
      total: 0,
      pendentes: 0,
      ativos: 0,
      bloqueados: 0,
      novos_hoje: 0,
      novos_mes: 0,
    });
    vi.mocked(fetchUsers).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 15 });
  });

  it("mantém título, busca nomeada e estado vazio responsivo", async () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Gestão de Usuários" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar usuários por nome, e-mail ou CPF" })).toBeInTheDocument();
    expect(await screen.findByText("Nenhum usuário encontrado com os filtros atuais.")).toBeInTheDocument();
  });

  it("envia a busca à paginação server-side", async () => {
    const user = userEvent.setup();
    renderPage();
    const search = screen.getByRole("textbox", { name: "Buscar usuários por nome, e-mail ou CPF" });

    await user.type(search, "Ana");
    await waitFor(() => expect(fetchUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: "Ana" })));
  });
});
