import {
  Plus, Pencil, Trash2, BookOpen, ChevronRight, CalendarDays, Star, Clock,
} from "lucide-react";

import {
  FLASH_CARD_SHADOW,
  FLASH_PRIMARY,
  FLASH_SUCCESS,
} from "@/lib/flashcards/constants";
import type { Deck, DeckMetricRow, Flashcard, FlashcardsView } from "@/lib/flashcards/types";
import {
  cardStudyStatus,
  deckEmoji,
  formatProxBr,
  formatProximaRevisao,
  metricForDeck,
  statusChipConfig,
  stripHtml,
} from "@/lib/flashcards/utils";

type Props = {
  view: FlashcardsView;
  decks: Deck[];
  deckMetrics: DeckMetricRow[];
  selectedDeck: Deck | null;
  deckCards: Flashcard[];
  deckStreakCount: (deckId: string) => number;
  onOpenDeckModal: (deck?: Deck | null) => void;
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
  deckMetrics,
  selectedDeck,
  deckCards,
  deckStreakCount,
  onOpenDeckModal,
  onDeleteDeck,
  onSelectDeck,
  onBackToDecks,
  onOpenCardModal,
  onDeleteCard,
  onStartReview,
}: Props) {
  if (view === "decks") {
    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-[#6B7280] dark:text-neutral-400">
            Agrupe cartões por matéria ou edital. Cada baralho usa o algoritmo Anki para priorizar o que você mais precisa rever.
          </p>
          <button
            type="button"
            onClick={() => onOpenDeckModal(null)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            style={{ backgroundColor: FLASH_PRIMARY }}
          >
            <Plus className="h-4 w-4" />
            Novo baralho
          </button>
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
              <button
                type="button"
                onClick={() => onOpenDeckModal()}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                style={{ backgroundColor: FLASH_PRIMARY }}
              >
                <Plus className="h-4 w-4" />
                Crie seu primeiro baralho
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {decks.map((deck) => {
                const m = metricForDeck(deckMetrics, deck.id);
                const accent = deck.cor_hex ?? FLASH_PRIMARY;
                const ds = deckStreakCount(deck.id);
                return (
                  <article
                    key={deck.id}
                    className="fc-deck-card group relative flex flex-col rounded-[12px] border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: accent,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl leading-none" aria-hidden>{deckEmoji(deck.nome)}</span>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onOpenDeckModal(deck)}
                          className="rounded-lg p-1.5 text-[#6B7280] hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Excluir o baralho "${deck.nome}"? Todos os cartões serão removidos.`))
                              onDeleteDeck(deck.id);
                          }}
                          className="rounded-lg p-1.5 text-[#6B7280] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="mt-2 truncate text-base font-bold text-[#1A1A2E] dark:text-neutral-100">
                      {deck.nome}
                    </h3>
                    {deck.descricao ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280] dark:text-neutral-400">{deck.descricao}</p>
                    ) : null}

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280] dark:text-neutral-400">Domínio</span>
                        <span className="tabular-nums text-sm font-semibold text-[#22C55E]">{m.dominio_pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, m.dominio_pct)}%`,
                            backgroundColor: FLASH_SUCCESS,
                          }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#6B7280] dark:text-neutral-400">
                      <span className="tabular-nums font-semibold text-[#1A1A2E] dark:text-neutral-200">{m.novos}</span>
                      {" "}novos ·{" "}
                      <span className="tabular-nums font-semibold text-[#F59E0B]">{m.vencidos}</span>
                      {" "}revisão ·{" "}
                      <span className="tabular-nums font-semibold text-[#6C3FC5]">{m.aprendendo}</span>
                      {" "}aprendendo
                    </p>

                    <p className="mt-2 text-xs text-[#6B7280] dark:text-neutral-500">
                      {formatProximaRevisao(m.vencidos, m.proxima_futura)}
                      {m.vencidos > 0 ? " — priorize estes cartões" : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                      <span className="tabular-nums font-medium">{deck.total_cards} cartões no baralho</span>
                      {ds > 0 ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          🔥 {ds} {ds === 1 ? "dia" : "dias"}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => onSelectDeck(deck)}
                        className="flex-1 rounded-xl border-2 border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/80 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-[#6C3FC5]"
                      >
                        Ver cartões
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartReview(deck.id)}
                        className="fc-review-btn flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                        style={{ backgroundColor: accent }}
                      >
                        Revisar
                      </button>
                    </div>
                  </article>
                );
              })}
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
        <span className="font-semibold text-[#1A1A2E] dark:text-neutral-100">{d.nome}</span>
      </nav>

      <div
        className="rounded-[12px] border border-neutral-100 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ boxShadow: FLASH_CARD_SHADOW }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-neutral-100">
              {d.nome}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280] dark:text-neutral-400">
              {deckCards.length} {deckCards.length === 1 ? "cartão" : "cartões"} neste baralho
            </p>
            <div className="mt-3 max-w-md">
              <div className="mb-1 flex justify-between text-xs font-medium text-[#6B7280]">
                <span>Domínio do baralho</span>
                <span className="tabular-nums text-[#22C55E]">{dm.dominio_pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-[#22C55E] transition-all"
                  style={{ width: `${Math.min(100, dm.dominio_pct)}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-[#1A1A2E] dark:text-neutral-200">
              <span className="whitespace-nowrap">🟢 {nDominados} dominados</span>
              <span className="mx-2 text-[#D1D5DB]">·</span>
              <span className="whitespace-nowrap">🟡 {nAprendendo} aprendendo</span>
              <span className="mx-2 text-[#D1D5DB]">·</span>
              <span className="whitespace-nowrap">🔴 {nNovos} novo{nNovos !== 1 ? "s" : ""}</span>
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenCardModal(null)}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              style={{ backgroundColor: FLASH_PRIMARY }}
            >
              <Plus className="h-4 w-4" />
              Novo cartão
            </button>
            <button
              type="button"
              onClick={() => onStartReview(d.id)}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            >
              Revisar baralho
            </button>
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
        <ul className="space-y-3">
          {deckCards.map((card) => {
            const st = cardStudyStatus(card);
            const chip = statusChipConfig(st);
            const versoPrev = stripHtml(card.verso);
            const frenteLine = stripHtml(card.frente) || "(sem conteúdo)";
            const isNovo = st === "novo";
            return (
              <li key={card.id} className="group max-w-full">
                <div
                  className="flex max-w-full gap-0 overflow-hidden rounded-[10px] border border-neutral-100 bg-white [box-sizing:border-box] dark:border-neutral-700 dark:bg-neutral-800"
                  style={{ boxShadow: FLASH_CARD_SHADOW }}
                >
                  <div
                    className="flex w-10 shrink-0 items-center justify-center rounded-l-[10px] py-2 text-center sm:w-[40px]"
                    style={{
                      backgroundColor: chip.bg,
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: chip.text }}
                    >
                      {chip.label}
                    </span>
                  </div>
                  <div
                    className="min-w-0 max-w-full flex-1 rounded-r-[10px] p-4 [box-sizing:border-box]"
                    style={{ maxWidth: "calc(100% - 40px)" }}
                  >
                    <div
                      className={[
                        "flex flex-col gap-3 lg:flex-row lg:items-stretch",
                        isNovo ? "lg:items-center" : "",
                      ].join(" ")}
                    >
                      <div
                        className="min-w-0 max-w-full flex-1 lg:max-w-[calc(100%-280px)]"
                        style={{ boxSizing: "border-box" }}
                      >
                        <p
                          className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1A1A2E] dark:text-neutral-100"
                          title={frenteLine}
                        >
                          {frenteLine}
                        </p>
                        <p
                          className="mt-1 truncate text-[13px] leading-snug text-[#9CA3AF] dark:text-neutral-500"
                          title={versoPrev || undefined}
                        >
                          {versoPrev || "—"}
                        </p>
                      </div>

                      {isNovo ? (
                        <div className="flex min-h-[72px] min-w-[240px] shrink-0 items-center justify-center text-center text-sm font-semibold text-[#3B82F6] dark:text-blue-400">
                          🆕 Novo cartão
                        </div>
                      ) : (
                        <div
                          className="grid min-w-[240px] shrink-0 grid-cols-2 content-center gap-x-4 gap-y-2 self-center text-[12px] text-[#6B7280] dark:text-neutral-400"
                        >
                          <span className="flex items-center gap-1.5 tabular-nums">
                            <span aria-hidden>🔁</span>
                            Rep: {card.repeticoes}
                          </span>
                          <span className="flex items-center gap-1.5 tabular-nums">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            Próx.: {formatProxBr(card.proxima_revisao)}
                          </span>
                          <span className="flex items-center gap-1.5 tabular-nums">
                            <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            Fac.: {Number(card.facilidade).toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1.5 tabular-nums">
                            <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            Int.: {card.intervalo}d
                          </span>
                        </div>
                      )}

                      <div className="flex shrink-0 gap-1 self-center opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
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
