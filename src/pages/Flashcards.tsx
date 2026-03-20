import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";

type FlashcardDeck = {
  id: string;
  user_id: string;
  nome: string;
  disciplina_id: string | null;
  descricao: string | null;
  cor_hex: string | null;
  total_cards: number;
  created_at: string;
};

type Flashcard = {
  id: string;
  deck_id: string;
  frente: string;
  verso: string;
  imagem_frente_url: string | null;
  imagem_verso_url: string | null;
  tags: string[] | null;
  intervalo: number;
  facilidade: number;
  repeticoes: number;
  proxima_revisao: string; // date
  ultima_revisao: string | null; // datetime
  created_at: string;
};

export function Flashcards() {
  const qc = useQueryClient();

  const { data: decks } = useQuery({
    queryKey: ["flashcards-decks"],
    queryFn: async () => (await api.get("/flashcards/decks")).data as FlashcardDeck[],
  });

  const { data: dueCards, isFetching, refetch } = useQuery({
    queryKey: ["flashcards-due"],
    queryFn: async () =>
      (await api.get("/flashcards/revisar?limit=50")).data as Flashcard[],
  });

  const [index, setIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  React.useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [dueCards]);

  const current = dueCards?.[index] ?? null;

  const responderMutation = useMutation({
    mutationFn: async (payload: { cardId: string; qualidade: number }) => {
      const res = await api.post(`/flashcards/${payload.cardId}/responder`, { qualidade: payload.qualidade });
      return res.data as Flashcard;
    },
    onSuccess: async () => {
      await refetch();
    },
  });

  const avaliar = async (qualidade: number) => {
    if (!current) return;
    await responderMutation.mutateAsync({ cardId: current.id, qualidade });
    setIsFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Flashcards</h2>
        <p className="text-sm text-muted-foreground">Revisão rápida com SM-2 (simplificado).</p>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Decks</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(decks ?? []).map((d) => (
            <div key={d.id} className="rounded-lg border border-border/40 bg-background p-3">
              <div className="text-sm font-semibold">{d.nome}</div>
              <div className="mt-1 text-xs text-muted-foreground">{d.total_cards} cards</div>
            </div>
          ))}
          {(decks ?? []).length === 0 ? <div className="text-sm text-muted-foreground">Sem decks.</div> : null}
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Revisar hoje</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {isFetching ? "Carregando..." : `${dueCards?.length ?? 0} cartões vencendo`}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border/40 bg-background px-3 py-2 text-xs hover:bg-muted"
            onClick={() => refetch()}
          >
            Atualizar
          </button>
        </div>

        {current ? (
          <div className="mt-4">
            <div className="rounded-xl border border-border/40 bg-background p-4">
              <div className="text-xs text-muted-foreground">
                Card {index + 1}/{dueCards?.length ?? 0} • próxima revisão: {current.proxima_revisao}
              </div>

              <div
                className="mt-3 cursor-pointer rounded-lg bg-muted/40 p-3"
                onClick={() => setIsFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setIsFlipped((f) => !f);
                }}
                aria-label="Virar cartão"
              >
                <div className="text-sm font-medium">{isFlipped ? "Verso" : "Frente"}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">{isFlipped ? current.verso : current.frente}</div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600 transition-colors duration-150 hover:bg-danger-50/80"
                  disabled={responderMutation.isPending}
                  onClick={() => avaliar(0)}
                >
                  <span className="mr-1 font-semibold">X</span> Errei (0)
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-rose/10 px-3 py-2 text-sm text-rose-600"
                  disabled={responderMutation.isPending}
                  onClick={() => avaliar(3)}
                >
                  Difícil (3)
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-yellow-300/20 px-3 py-2 text-sm text-yellow-700"
                  disabled={responderMutation.isPending}
                  onClick={() => avaliar(4)}
                >
                  Bom (4)
                </button>
                <button
                  type="button"
                  className="rounded-md border border-success-100 bg-success-50 px-3 py-2 text-sm font-medium text-success-600 transition-colors duration-150 hover:bg-success-50/80"
                  disabled={responderMutation.isPending}
                  onClick={() => avaliar(5)}
                >
                  <span className="mr-1 font-semibold">✓</span> Fácil (5)
                </button>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                repeticoes: {current.repeticoes} • facilidade: {current.facilidade.toFixed(2)} • intervalo: {current.intervalo} dias
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">Nenhum cartão vencendo agora.</div>
        )}
      </div>
    </div>
  );
}

