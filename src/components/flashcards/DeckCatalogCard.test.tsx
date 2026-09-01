import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeckCatalogCard } from "@/components/flashcards/DeckCatalogCard";
import { DEFAULT_DECK_COLOR } from "@/lib/palette/deck-colors";
import type { Deck, DeckMetricRow } from "@/lib/flashcards/types";

const deck: Deck = {
  id: "deck-1",
  nome: "Direito Constitucional",
  parent_id: null,
  disciplina_id: null,
  descricao: "Princípios fundamentais e direitos individuais.",
  cor_hex: DEFAULT_DECK_COLOR,
  total_cards: 18,
  full_path: "Direito Constitucional",
  created_at: "2026-08-24T00:00:00Z",
};

const metric: DeckMetricRow = {
  deck_id: deck.id,
  novos: 5,
  aprendendo: 3,
  vencidos: 4,
  dominio_pct: 62,
  proxima_futura: null,
};

describe("DeckCatalogCard", () => {
  it("resume o baralho e oferece acesso aos cartões e ao estudo", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onReview = vi.fn();

    render(
      <DeckCatalogCard
        deck={deck}
        metric={metric}
        onOpen={onOpen}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReview={onReview}
      />,
    );

    expect(screen.getByText(deck.nome)).toBeInTheDocument();
    expect(screen.getByText("18 cartões")).toBeInTheDocument();
    expect(screen.getByText("4 para revisar")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Domínio do baralho: 62%" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver cartões" }));
    await user.click(screen.getByRole("button", { name: "Estudar" }));
    expect(onOpen).toHaveBeenCalledWith(deck);
    expect(onReview).toHaveBeenCalledWith(deck.id);
  });

  it("expõe edição e exclusão no menu contextual do baralho", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <DeckCatalogCard
        deck={deck}
        metric={metric}
        onOpen={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onReview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: `Ações do baralho ${deck.nome}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Editar baralho" }));
    expect(onEdit).toHaveBeenCalledWith(deck);

    await user.click(screen.getByRole("button", { name: `Ações do baralho ${deck.nome}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Excluir baralho" }));
    expect(onDelete).toHaveBeenCalledWith(deck);
  });
});
