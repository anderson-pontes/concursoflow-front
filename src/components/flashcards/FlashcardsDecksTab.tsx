import {
  Plus, Pencil, Trash2, BookOpen, ChevronRight, FileArchive, Play,
} from "lucide-react";

import {
  FLASH_CARD_SHADOW,
  FLASH_PRIMARY,
  FLASH_SUCCESS,
} from "@/lib/flashcards/constants";
import type { Deck, DeckMetricRow, Flashcard, FlashcardsView } from "@/lib/flashcards/types";
import {
  cardStudyStatus,
  metricForDeck,
  stripHtml,
} from "@/lib/flashcards/utils";
import { DeckTree } from "@/components/flashcards/DeckTree";

type Props = {
  view: FlashcardsView;
  decks: Deck[];
  treeDecks: Deck[];
  deckMetrics: DeckMetricRow[];
  selectedDeck: Deck | null;
  deckCards: Flashcard[];
  deckStreakCount: (deckId: string) => number;
  onOpenDeckModal: (deck?: Deck | null) => void;
  onOpenImport: () => void;
  onDeleteAllDecks: () => void;
  deletingAll: boolean;
  onDeleteDeck: (id: string) => void;
  onSelectDeck: (deck: Deck) => void;
  onBackToDecks: () => void;
  onOpenCardModal: (card?: Flashcard | null) => void;
  onDeleteCard: (id: string) => void;
  onStartReview: (deckId: string) => void;
};

export function FlashcardsDecksTab({
  view,
  decks,
  treeDecks,
  deckMetrics,
  selectedDeck,
  deckCards,
  deckStreakCount,
  onOpenDeckModal,
  onOpenImport,
  onDeleteAllDecks,
  deletingAll,
  onDeleteDeck,
  onSelectDeck,
  onBackToDecks,
  onOpenCardModal,
  onDeleteCard,
  onStartReview,
}: Props) {
  const safeTree = treeDecks.length > 0 ? treeDecks : decks.filter((d) => !d.parent_id);

  if (view === "decks") {
    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-[#6B7280] dark:text-neutral-400">
            Agrupe cartões por matéria ou edital. Cada baralho usa o algoritmo Anki para priorizar o que você mais precisa rever.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/70 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-[#6C3FC5]"
            >
              <FileArchive className="h-4 w-4" />
              Importar Anki (.apkg)
            </button>
            <button
              type="button"
              onClick={() => onOpenDeckModal(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              style={{ backgroundColor: FLASH_PRIMARY }}
            >
              <Plus className="h-4 w-4" />
              Novo baralho
            </button>
            <button
              type="button"
              disabled={deletingAll || decks.length === 0}
              onClick={() => {
                if (confirm("Excluir TODOS os baralhos? Esta ação oculta todos os decks da sua conta.")) {
                  onDeleteAllDecks();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-neutral-800 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              {deletingAll ? "Excluindo..." : "Excluir todos"}
            </button>
          </div>
        </div>

        <div>
          {decks.length === 0 ? (
            <div
              className="flex flex-col items-center gap-5 rounded-[12px] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-600 dark:bg-neutral-800"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              <svg
                width="120"
                height="100"
                viewBox="0 0 120 100"
                fill="none"
                className="text-[#6C3FC5]"
                aria-hidden
              >
                <rect x="8" y="20" width="72" height="52" rx="8" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
                <rect x="36" y="32" width="72" height="52" rx="8" fill="white" stroke="currentColor" strokeWidth="2" className="dark:fill-neutral-800" />
                <path d="M52 52h40M52 60h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
              </svg>
              <div>
                <p className="text-base font-bold text-[#1A1A2E] dark:text-neutral-100">Nenhum baralho ainda</p>
                <p className="mt-1 text-sm text-[#6B7280] dark:text-neutral-400">
                  Crie baralhos para revisar com repetição espaçada.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDeckModal()}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                  style={{ backgroundColor: FLASH_PRIMARY }}
                >
                  <Plus className="h-4 w-4" />
                  Crie seu primeiro baralho
                </button>
                <button
                  type="button"
                  onClick={onOpenImport}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/70 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <FileArchive className="h-4 w-4" />
                  Importar do Anki
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-neutral-100 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280] dark:text-neutral-400">
                Estrutura de baralhos
              </p>
              <DeckTree
                decks={safeTree}
                selectedId={selectedDeck?.id ?? null}
                onSelect={onSelectDeck}
              />
            </div>
          )}
        </div>
      </>
    );
  }

  const d = selectedDeck!;
  const dm = metricForDeck(deckMetrics, d.id);
  const nDominados = deckCards.filter((c) => cardStudyStatus(c) === "dominado").length;
  const nAprendendo = deckCards.filter((c) => cardStudyStatus(c) === "aprendendo").length;
  const nNovos = deckCards.filter((c) => cardStudyStatus(c) === "novo").length;
  const nVencidos = dm.vencidos;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-[#6B7280] dark:text-neutral-400">
        <button
          type="button"
          onClick={onBackToDecks}
          className="rounded-lg px-1 py-0.5 text-[#6C3FC5] transition hover:underline dark:text-violet-300"
        >
          Flashcards
        </button>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <span className="font-semibold text-[#1A1A2E] dark:text-neutral-100">
          {d.full_path ?? d.nome}
        </span>
      </nav>

      <div
        className="rounded-[12px] border border-neutral-100 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ boxShadow: FLASH_CARD_SHADOW }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-neutral-100">
                {d.nome}
              </h2>
              <p className="mt-1 text-sm text-[#6B7280] dark:text-neutral-400">
                {deckCards.length} {deckCards.length === 1 ? "cartão" : "cartões"} · {nVencidos} para revisar hoje
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenCardModal(null)}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <Plus className="h-4 w-4" />
                Novo cartão
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartReview(d.id)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-white shadow-md transition hover:brightness-110"
            style={{ backgroundColor: FLASH_PRIMARY }}
          >
            <Play className="h-5 w-5" />
            Estudar este baralho
          </button>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">Novos</p>
              <p className="tabular-nums font-semibold text-[#1A1A2E] dark:text-neutral-100">{nNovos}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">Aprendendo</p>
              <p className="tabular-nums font-semibold text-[#1A1A2E] dark:text-neutral-100">{nAprendendo}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">Dominados</p>
              <p className="tabular-nums font-semibold text-[#1A1A2E] dark:text-neutral-100">{nDominados}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">Domínio</p>
              <p className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{dm.dominio_pct}%</p>
            </div>
          </div>
        </div>
      </div>

      {deckCards.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-[12px] border border-dashed border-neutral-300 bg-white py-14 text-center dark:border-neutral-600 dark:bg-neutral-800"
          style={{ boxShadow: FLASH_CARD_SHADOW }}
        >
          <BookOpen className="h-12 w-12 text-[#6C3FC5]/40" />
          <p className="text-sm text-[#6B7280]">Nenhum cartão neste baralho.</p>
          <button
            type="button"
            onClick={() => onOpenCardModal()}
            className="rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: FLASH_PRIMARY }}
          >
            Criar primeiro cartão
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {deckCards.map((card) => {
            const versoPrev = stripHtml(card.verso);
            const frenteLine = stripHtml(card.frente) || "(sem conteúdo)";
            return (
              <li key={card.id} className="group max-w-full">
                <div
                  className="flex max-w-full items-center gap-3 overflow-hidden rounded-[10px] border border-neutral-100 bg-white p-3 [box-sizing:border-box] dark:border-neutral-700 dark:bg-neutral-800"
                  style={{ boxShadow: FLASH_CARD_SHADOW }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-neutral-100"
                      title={frenteLine}
                    >
                      {frenteLine}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-[#9CA3AF] dark:text-neutral-500"
                      title={versoPrev || undefined}
                    >
                      {versoPrev || "—"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onOpenCardModal(card)}
                      className="rounded-lg p-2 text-[#6B7280] hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Excluir este cartão?"))
                          onDeleteCard(card.id);
                      }}
                      className="rounded-lg p-2 text-[#6B7280] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
