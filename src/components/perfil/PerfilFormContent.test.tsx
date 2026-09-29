import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PerfilFormContent } from "@/components/perfil/PerfilFormContent";
import { updateMeApi, type MeApiResponse } from "@/services/profileApi";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/services/profileApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/profileApi")>();
  return { ...actual, updateMeApi: vi.fn() };
});

function me(overrides: Partial<MeApiResponse> = {}): MeApiResponse {
  return {
    id: "user-1",
    name: "Ana Souza",
    email: "ana@example.com",
    avatar_url: null,
    daily_goal_hours: 2,
    role: "user",
    status: "ativo",
    created_at: "2026-09-01T12:00:00Z",
    cpf: null,
    phone: null,
    birth_date: null,
    address_cep: "01001000",
    address_street: "Praça da Sé",
    address_number: "1",
    address_complement: null,
    address_neighborhood: "Sé",
    address_city: "São Paulo",
    address_state: "SP",
    ...overrides,
  };
}

function renderForm(serverMe: MeApiResponse) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  const result = render(
    <QueryClientProvider client={client}>
      <PerfilFormContent serverMe={serverMe} onCancel={vi.fn()} />
    </QueryClientProvider>,
  );
  return { ...result, client, invalidateSpy };
}

describe("PerfilFormContent", () => {
  beforeEach(() => {
    vi.mocked(updateMeApi).mockReset();
    useAuthStore.setState({ user: null });
  });

  it("carrega e sincroniza o nome assíncrono no estado real do formulário", async () => {
    const first = me();
    const { rerender, client } = renderForm(first);

    expect(screen.getByRole("textbox", { name: "Nome completo" })).toHaveValue("Ana Souza");
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveValue("ana@example.com");
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("readonly");
    expect(screen.queryByText("Endereço")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("CEP")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data de nascimento")).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={client}>
        <PerfilFormContent serverMe={me({ name: "Beatriz Lima" })} onCancel={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Nome completo" })).toHaveValue("Beatriz Lima");
    });
  });

  it("envia o nome sem e-mail, nascimento ou endereço e atualiza os caches", async () => {
    const user = userEvent.setup();
    const updated = me({ name: "Maria Oliveira" });
    vi.mocked(updateMeApi).mockResolvedValue(updated);
    const { invalidateSpy } = renderForm(me());

    const nameInput = screen.getByRole("textbox", { name: "Nome completo" });
    await user.clear(nameInput);
    await user.type(nameInput, "  Maria Oliveira  ");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(updateMeApi).toHaveBeenCalledWith({
        name: "Maria Oliveira",
        cpf: null,
        phone: null,
      });
    });
    expect(vi.mocked(updateMeApi).mock.calls[0][0]).not.toHaveProperty("email");
    expect(vi.mocked(updateMeApi).mock.calls[0][0]).not.toHaveProperty("address_cep");
    expect(vi.mocked(updateMeApi).mock.calls[0][0]).not.toHaveProperty("birth_date");
    expect(useAuthStore.getState().user?.name).toBe("Maria Oliveira");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["auth-me-profile"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-users"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-user", "user-1"] });
  });

  it("mostra uma mensagem específica quando o nome está vazio", async () => {
    const user = userEvent.setup();
    renderForm(me());

    await user.clear(screen.getByRole("textbox", { name: "Nome completo" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Informe um nome com pelo menos 3 caracteres")).toBeInTheDocument();
    expect(updateMeApi).not.toHaveBeenCalled();
  });
});
