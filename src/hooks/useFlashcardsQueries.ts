import { useQuery } from "@tanstack/react-query";

import type {
  Deck,
  Flashcard,
  FlashcardConfig,
  FlashcardsMetrics,
  FlashcardsTab,
} from "@/lib/flashcards/types";
import { api } from "@/services/api";

type UseFlashcardsQueriesOptions = {
  selectedDeckId?: string;
  reviewDeckId: string | null;
  tab: FlashcardsTab;
};

export function useFlashcardsQueries({
  selectedDeckId,
  reviewDeckId,
  tab,
}: UseFlashcardsQueriesOptions) {
  const { data: deckFlat = [] } = useQuery({
    queryKey: ["flashcards-decks-flat"],
    queryFn: async () => (await api.get("/flashcards/decks/flat")).data as Deck[],
  });

  const { data: deckTree = [] } = useQuery({
    queryKey: ["flashcards-decks-tree"],
    queryFn: async () => (await api.get("/flashcards/decks/tree")).data as Deck[],
  });

  const { data: metrics } = useQuery({
    queryKey: ["flashcards-metrics"],
    queryFn: async () => (await api.get("/flashcards/metrics")).data as FlashcardsMetrics,
  });

  const { data: deckCards = [] } = useQuery({
    queryKey: ["flashcards-cards", selectedDeckId],
    enabled: Boolean(selectedDeckId),
    queryFn: async () =>
      (await api.get(`/flashcards?deck_id=${selectedDeckId}&include_subdecks=true`))
        .data as Flashcard[],
  });

  const reviewQuery = useQuery({
    queryKey: ["flashcards-due", reviewDeckId],
    enabled: tab === "revisar",
    queryFn: async () => {
      const url = reviewDeckId
        ? `/flashcards/revisar?limit=100&deck_id=${reviewDeckId}&include_subdecks=true`
        : "/flashcards/revisar?limit=100";
      return (await api.get(url)).data as Flashcard[];
    },
  });

  const configQuery = useQuery({
    queryKey: ["flashcards-config"],
    queryFn: async () => (await api.get("/flashcards/config")).data as FlashcardConfig,
    enabled: tab === "config",
  });

  return { deckFlat, deckTree, metrics, deckCards, reviewQuery, configQuery };
}
