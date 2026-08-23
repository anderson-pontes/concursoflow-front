import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFlashcardReviewKeyboard } from "@/hooks/useFlashcardReviewKeyboard";
import type { Flashcard } from "@/lib/flashcards/types";

const card = { id: "card-1", deck_id: "deck-1" } as Flashcard;

function KeyboardHarness({
  flipped = false,
  onFlip,
  onRespond,
}: {
  flipped?: boolean;
  onFlip: () => void;
  onRespond: (response: { cardId: string; label: string; deckId?: string }) => void;
}) {
  useFlashcardReviewKeyboard({
    tab: "revisar",
    sessionActive: true,
    currentCard: card,
    flipped,
    responding: false,
    onFlip,
    onRespond,
  });
  return <input aria-label="Campo editável" />;
}

describe("useFlashcardReviewKeyboard", () => {
  it("vira o cartão e responde pelos atalhos da sessão", () => {
    const onFlip = vi.fn();
    const onRespond = vi.fn();
    const { rerender } = render(<KeyboardHarness onFlip={onFlip} onRespond={onRespond} />);

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onFlip).toHaveBeenCalledOnce();

    rerender(<KeyboardHarness flipped onFlip={onFlip} onRespond={onRespond} />);
    fireEvent.keyDown(window, { key: "3" });
    expect(onRespond).toHaveBeenCalledWith({ cardId: "card-1", label: "bom", deckId: "deck-1" });
  });

  it("não captura teclas enquanto a pessoa digita em um campo", () => {
    const onFlip = vi.fn();
    const onRespond = vi.fn();
    const { getByRole } = render(<KeyboardHarness flipped onFlip={onFlip} onRespond={onRespond} />);

    fireEvent.keyDown(getByRole("textbox", { name: "Campo editável" }), { key: "1" });
    expect(onFlip).not.toHaveBeenCalled();
    expect(onRespond).not.toHaveBeenCalled();
  });
});
