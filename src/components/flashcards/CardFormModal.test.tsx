import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardFormModal } from "@/components/flashcards/CardFormModal";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

afterEach(() => vi.clearAllMocks());

describe("CardFormModal", () => {
  it("carrega o editor Tiptap sob demanda no fluxo de criação", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <CardFormModal
          open
          onClose={vi.fn()}
          deckId="deck-1"
          deckName="Direito Constitucional"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Novo cartão" })).toBeInTheDocument();
    expect(await screen.findByRole("textbox", undefined, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Negrito/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cor do texto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista numerada" })).toBeInTheDocument();
  });

  it("salva um cartão existente sem alterar silenciosamente o HTML", async () => {
    const user = userEvent.setup();
    const frente = "<h2>Princípios fundamentais</h2><p><strong>Fundamento</strong> da República.</p>";
    const verso = "<p><u>Soberania</u> e <em>cidadania</em>.</p><ul><li><p>Artigo 1º</p></li></ul>";
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.put).mockResolvedValue({ data: { id: "card-1" } });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <CardFormModal
          open
          onClose={vi.fn()}
          deckId="deck-1"
          deckName="Direito Constitucional"
          card={{
            id: "card-1",
            deck_id: "deck-1",
            frente,
            verso,
            tags: ["constitucional"],
            imagem_frente_url: null,
            imagem_verso_url: null,
          }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("textbox", undefined, { timeout: 10_000 })).toHaveTextContent("Princípios fundamentais");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.put).toHaveBeenCalledWith("/flashcards/card-1", {
      deck_id: "deck-1",
      frente,
      verso,
      tags: ["constitucional"],
    });
  });
});
