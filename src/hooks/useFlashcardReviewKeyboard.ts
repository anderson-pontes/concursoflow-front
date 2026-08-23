import { useEffect } from "react";

import type { Flashcard, FlashcardsTab } from "@/lib/flashcards/types";

type ReviewResponse = {
  cardId: string;
  label: string;
  deckId?: string;
};

type UseFlashcardReviewKeyboardOptions = {
  tab: FlashcardsTab;
  sessionActive: boolean;
  currentCard: Flashcard | null;
  flipped: boolean;
  responding: boolean;
  onFlip: () => void;
  onRespond: (response: ReviewResponse) => void;
};

export function useFlashcardReviewKeyboard({
  tab,
  sessionActive,
  currentCard,
  flipped,
  responding,
  onFlip,
  onRespond,
}: UseFlashcardReviewKeyboardOptions) {
  useEffect(() => {
    if (tab !== "revisar" || !sessionActive || !currentCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;

      if ((event.key === " " || event.key === "Enter") && !flipped) {
        event.preventDefault();
        onFlip();
        return;
      }

      if (!flipped || responding) return;
      const label = { "1": "errei", "2": "dificil", "3": "bom", "4": "facil" }[event.key];
      if (!label) return;

      event.preventDefault();
      onRespond({ cardId: currentCard.id, label, deckId: currentCard.deck_id });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, flipped, onFlip, onRespond, responding, sessionActive, tab]);
}
