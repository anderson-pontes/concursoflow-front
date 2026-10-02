import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditalCreateForm } from "@/components/admin/editais/EditalCreateForm";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

const criarEditalAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/services/editaisCatalogo", () => ({ criarEditalAdmin }));
vi.mock("@/components/concursos/FileDropZone", () => ({ FileDropZone: ({ label }: { label: string }) => <div>{label}</div> }));

const created: EditalCatalogo = {
  id: "edital-2",
  nome: "Receita Federal 2026",
  orgao: "Receita Federal",
  banca: "FGV",
  url_oficial: null,
  edital_url: null,
  logo_url: null,
  status: "rascunho",
  versao_atual: null,
};

function renderForm(onCreated = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><EditalCreateForm onCancel={vi.fn()} onCreated={onCreated} /></QueryClientProvider>);
  return onCreated;
}

describe("EditalCreateForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria o edital com os dados informados", async () => {
    const user = userEvent.setup();
    criarEditalAdmin.mockResolvedValue(created);
    const onCreated = renderForm();

    await user.type(screen.getByLabelText(/nome do edital/i), "Receita Federal 2026");
    await user.type(screen.getByLabelText(/^órgão/i), "Receita Federal");
    await user.type(screen.getByLabelText(/banca/i), "FGV");
    await user.type(screen.getByLabelText(/cargo principal/i), "Auditor Fiscal");
    await user.click(screen.getByRole("button", { name: /criar e organizar conteúdo/i }));

    await waitFor(() => expect(criarEditalAdmin).toHaveBeenCalledTimes(1));
    expect(criarEditalAdmin.mock.calls[0][0]).toEqual(expect.objectContaining({ nome: "Receita Federal 2026", orgao: "Receita Federal", banca: "FGV", cargo_nome: "Auditor Fiscal" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onCreated.mock.calls[0][0]).toEqual(created);
  });

  it("preserva os campos para uma nova tentativa quando a API falha", async () => {
    const user = userEvent.setup();
    criarEditalAdmin.mockRejectedValue(new Error("offline"));
    renderForm();

    await user.type(screen.getByLabelText(/nome do edital/i), "Edital preservado");
    await user.type(screen.getByLabelText(/^órgão/i), "Órgão preservado");
    await user.type(screen.getByLabelText(/cargo principal/i), "Cargo preservado");
    await user.click(screen.getByRole("button", { name: /criar e organizar conteúdo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/dados foram preservados/i);
    expect(screen.getByLabelText(/nome do edital/i)).toHaveValue("Edital preservado");
    expect(screen.getByLabelText(/^órgão/i)).toHaveValue("Órgão preservado");
    expect(screen.getByLabelText(/cargo principal/i)).toHaveValue("Cargo preservado");
  });
});
