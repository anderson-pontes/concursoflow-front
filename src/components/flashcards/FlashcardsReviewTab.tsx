import { RotateCcw, CheckCircle2, Play } from "lucide-react";

import { FLASH_CARD_SHADOW, FLASH_PRIMARY } from "@/lib/flashcards/constants";
import type { Deck, DeckMetricRow, Flashcard, FlashcardConfig } from "@/lib/flashcards/types";
import {
  earliestFutureReview,
  fmtDias,
  formatProxBr,
  previewIntervalos,
  stripHtml,
  todayYmd,
  urgencyForDueCard,
} from "@/lib/flashcards/utils";

type SessionStats = { correct: number; wrong: number };

type Props = {
  isLoading: boolean;
  dueCards: Flashcard[];
  decks: Deck[];
  deckMetrics: DeckMetricRow[];
  totalCardsGlobal: number;
  dueTodayTotal: number;
  reviewDeckId: string | null;
  reviewIdx: number;
  flipped: boolean;
  reviewDone: number;
  reviewSessionActive: boolean;
  sessionStartTs: number | null;
  sessionStats: SessionStats;
  currentCard: Flashcard | null;
  cfg: FlashcardConfig;
  responderPending: boolean;
  onSetReviewDeckId: (id: string | null) => void;
  onSetFlipped: (flipped: boolean) => void;
  onRespond: (params: { cardId: string; label: string; deckId?: string }) => void;
  onRefetch: () => void;
  onGoToConfig: () => void;
  onGoToBaralhos: () => void;
  onStartSession: (startIdx: number) => void;
  onExitSession: () => void;
  onRestartSession: () => void;
  onCompleteSessionGoToBaralhos: () => void;
};

export function FlashcardsReviewTab({
  isLoading,
  dueCards,
  decks,
  deckMetrics,
  totalCardsGlobal,
  dueTodayTotal,
  reviewDeckId,
  reviewIdx,
  flipped,
  reviewDone,
  reviewSessionActive,
  sessionStartTs,
  sessionStats,
  currentCard,
  cfg,
  responderPending,
  onSetReviewDeckId,
  onSetFlipped,
  onRespond,
  onRefetch,
  onGoToConfig,
  onGoToBaralhos,
  onStartSession,
  onExitSession,
  onRestartSession,
  onCompleteSessionGoToBaralhos,
}: Props) {
  if (isLoading) {
    return (
      <div className="relative space-y-4 pb-28">
        <div className="py-16 text-center text-sm text-[#6B7280]">Carregando pendências…</div>
      </div>
    );
  }

  if (dueCards.length === 0) {
    const nextIso = earliestFutureReview(deckMetrics);
    const today = todayYmd();
    let nextLine = "Consulte seus baralhos para a próxima leva.";
    if (nextIso) {
      const d = new Date(`${nextIso.slice(0, 10)}T12:00:00`);
      const t0 = new Date(`${today}T12:00:00`);
      const diff = Math.round((d.getTime() - t0.getTime()) / 86400000);
      const when =
        diff <= 0
          ? "em breve"
          : diff === 1
            ? "amanhã às 08h"
            : `${formatProxBr(nextIso)} (às 08h)`;
      nextLine = `Próxima revisão: ${when}`;
    }
    const restantes = Math.max(0, totalCardsGlobal - dueTodayTotal);

    return (
      <div className="relative space-y-4 pb-28">
        <div
          className="mx-auto flex max-w-lg flex-col items-center gap-6 rounded-[12px] border border-neutral-100 bg-white px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-800"
          style={{ boxShadow: FLASH_CARD_SHADOW }}
        >
          <div className="relative h-28 w-36" aria-hidden>
            <svg viewBox="0 0 140 110" className="h-full w-full text-[#6C3FC5]">
              <rect x="12" y="24" width="88" height="62" rx="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
              <rect x="32" y="14" width="88" height="62" rx="10" fill="white" stroke="currentColor" strokeWidth="2" className="dark:fill-neutral-800" />
              <path d="M48 44h56M48 54h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
            </svg>
            <div className="absolute bottom-2 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E] text-white fc-check-bounce shadow-lg">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-neutral-100">Tudo em dia! 🎉</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280] dark:text-neutral-400">
              Você revisou todos os cartões programados para hoje.
            </p>
          </div>
          <div
            className="w-full rounded-[10px] border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-[#1A1A2E] dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-neutral-200"
          >
            <p className="font-medium">{nextLine}</p>
            <p className="mt-1 text-xs text-[#6B7280] dark:text-neutral-400">
              <span className="tabular-nums font-semibold text-[#6C3FC5]">{restantes}</span>
              {" "}cartões ativos nos seus baralhos
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onGoToConfig}
              className="rounded-[10px] border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            >
              Revisar no avançado
            </button>
            <button
              type="button"
              onClick={onGoToBaralhos}
              className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              style={{ backgroundColor: FLASH_PRIMARY }}
            >
              Ver meus baralhos
            </button>
          </div>
          <button
            type="button"
            onClick={onRefetch}
            className="inline-flex items-center gap-2 rounded-[10px] border-2 border-[#6C3FC5] bg-white px-5 py-2 text-sm font-semibold text-[#6C3FC5] transition hover:bg-violet-50 dark:bg-neutral-800 dark:hover:bg-violet-950/40"
          >
            <RotateCcw className="h-4 w-4" />
            Atualizar lista
          </button>
        </div>
      </div>
    );
  }

  if (reviewSessionActive && reviewIdx >= dueCards.length) {
    const durMin = sessionStartTs != null ? Math.floor((Date.now() - sessionStartTs) / 60000) : 0;
    const durLabel = durMin < 1 ? "< 1 min" : `${durMin} min`;

    return (
      <div className="relative space-y-4 pb-28">
        <div className="flex flex-col items-center gap-6 px-2 py-8 text-center">
          <div className="fc-session-check-in text-6xl leading-none" aria-hidden>
            ✅
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-[#1A1A2E]">Sessão concluída! 🎉</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Você revisou todos os{" "}
              <span className="tabular-nums font-semibold text-[#1A1A2E]">{reviewDone}</span> cartões de hoje.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              ✅ {sessionStats.correct} acertos
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800">
              ❌ {sessionStats.wrong} erros
            </span>
            <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800">
              ⏱ Duração: {durLabel}
            </span>
          </div>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onCompleteSessionGoToBaralhos}
              className="rounded-[10px] border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors duration-200 ease-out hover:bg-[#F9FAFB]"
            >
              Ver meus baralhos
            </button>
            <button
              type="button"
              onClick={onRestartSession}
              className="rounded-[10px] bg-[#6C3FC5] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-[#5B32A8]"
            >
              Revisar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviewSessionActive) {
    return (
      <div className="relative space-y-4 pb-28">
        <div className="space-y-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          <style>{`
            .fc-review-card-content img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 8px auto; }
            .fc-review-card-content p { margin: 0 0 0.5em; }
            .fc-review-card-content ul { list-style: disc; padding-left: 1.4em; }
            .fc-review-card-content ol { list-style: decimal; padding-left: 1.4em; }
          `}</style>

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={onExitSession}
              className="shrink-0 border-0 bg-transparent p-0 text-left text-sm font-medium text-[#6B7280] transition-colors duration-200 ease-out hover:text-[#6C3FC5]"
            >
              ← Sair da sessão
            </button>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${dueCards.length ? (100 * reviewDone) / dueCards.length : 0}%`,
                  transition: "width 400ms ease",
                  background: "linear-gradient(90deg, #6C3FC5, #8B5CF6)",
                }}
              />
            </div>
            <p className="shrink-0 text-[13px] font-medium tabular-nums text-[#6B7280]">
              {reviewDone} de {dueCards.length} cartões
            </p>
          </div>

          {currentCard ? (
            <div
              className="flex flex-col justify-center rounded-[20px] bg-white px-6 py-8 sm:px-12 sm:py-10"
              style={{
                borderTop: "4px solid #6C3FC5",
                boxShadow: "0 8px 40px rgba(108,63,197,0.12)",
                minHeight: 280,
              }}
            >
              <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[2px] text-[#9CA3AF]">
                FRENTE
              </p>
              <div
                className="fc-review-card-content mx-auto max-w-full text-center text-[18px] font-medium leading-[1.8] text-[#1A1A2E]"
                style={{ overflowWrap: "break-word", fontWeight: 500 }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: currentCard.frente }}
              />

              <div className="my-6 border-t border-[#F3F4F6]" />

              {!flipped ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetFlipped(true)}
                    className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[12px] bg-[#6C3FC5] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(108,63,197,0.35)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#5B32A8] hover:shadow-[0_8px_24px_rgba(108,63,197,0.45)]"
                  >
                    <span aria-hidden>👁</span>
                    Revelar resposta
                  </button>
                  <p className="text-center text-[11px] text-[#9CA3AF]">ou pressione Espaço / Enter</p>
                </div>
              ) : null}

              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-out"
                style={{ maxHeight: flipped ? 4000 : 0 }}
              >
                {flipped ? (
                  <div className="pt-2">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[2px] text-[#9CA3AF]">VERSO</p>
                    <div
                      className="fc-review-card-content rounded-[12px] border-l-[3px] border-[#6C3FC5] bg-[#FAFAFA] p-5 text-base leading-[1.8] text-[#374151]"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: currentCard.verso }}
                    />

                    {(() => {
                      const prev = previewIntervalos(currentCard, cfg);
                      const btns = [
                        {
                          api: "errei",
                          kbd: "1",
                          emoji: "😵",
                          title: "Errei",
                          sub: "<1 d",
                          className:
                            "border-2 border-[#FEE2E2] bg-[#FFF5F5] text-[#374151] hover:bg-[#FEE2E2] hover:border-[#EF4444] hover:text-[#EF4444]",
                          subHover: "group-hover:text-[#EF4444]",
                        },
                        {
                          api: "dificil",
                          kbd: "2",
                          emoji: "😓",
                          title: "Difícil",
                          sub: fmtDias(prev.dificil),
                          className:
                            "border-2 border-[#FEF3C7] bg-[#FFFBEB] text-[#374151] hover:bg-[#FEF3C7] hover:border-[#F59E0B] hover:text-[#D97706]",
                          subHover: "group-hover:text-[#D97706]",
                        },
                        {
                          api: "bom",
                          kbd: "3",
                          emoji: "🙂",
                          title: "Bom",
                          sub: fmtDias(prev.bom),
                          className:
                            "border-2 border-[#DBEAFE] bg-[#EFF6FF] text-[#374151] hover:bg-[#DBEAFE] hover:border-[#3B82F6] hover:text-[#2563EB]",
                          subHover: "group-hover:text-[#2563EB]",
                        },
                        {
                          api: "facil",
                          kbd: "4",
                          emoji: "😄",
                          title: "Fácil",
                          sub: fmtDias(prev.facil),
                          className:
                            "border-2 border-[#D1FAE5] bg-[#F0FDF4] text-[#374151] hover:bg-[#D1FAE5] hover:border-[#22C55E] hover:text-[#16A34A]",
                          subHover: "group-hover:text-[#16A34A]",
                        },
                      ] as const;
                      return (
                        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                          {btns.map((b) => (
                            <button
                              key={b.api}
                              type="button"
                              disabled={responderPending}
                              title={`${b.title} · tecla ${b.kbd}`}
                              onClick={() =>
                                onRespond({
                                  cardId: currentCard.id,
                                  label: b.api,
                                  deckId: currentCard.deck_id,
                                })
                              }
                              className={`group relative flex flex-col items-center gap-1.5 rounded-[12px] px-2 py-4 transition-colors duration-150 ease-out disabled:opacity-60 ${b.className}`}
                            >
                              <span className="pointer-events-none absolute right-1.5 top-1.5 text-[10px] font-bold text-[#9CA3AF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                {b.kbd}
                              </span>
                              <span className="text-2xl leading-none" aria-hidden>
                                {b.emoji}
                              </span>
                              <span className="text-sm font-semibold">{b.title}</span>
                              <span
                                className={`text-[11px] text-[#6B7280] transition-colors duration-150 ${b.subHover}`}
                              >
                                {b.sub}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <p className="mt-4 text-center text-xs text-[#9CA3AF]">
                      🔁 {currentCard.repeticoes} repetições &nbsp;•&nbsp; ⭐ Facilidade:{" "}
                      {Number(currentCard.facilidade).toFixed(2)} &nbsp;•&nbsp; ⏱ Intervalo: {currentCard.intervalo}d
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pb-28">
      <div className="space-y-5">
        <p className="text-sm text-[#6B7280] dark:text-neutral-400">
          Escolha o baralho ou revise tudo de uma vez. Toque em um cartão para abrir só ele, ou inicie a sessão completa.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetReviewDeckId(null)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              reviewDeckId === null
                ? "bg-[#6C3FC5] text-white shadow-md"
                : "border border-neutral-200 bg-white text-[#1A1A2E] hover:border-[#6C3FC5] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
            ].join(" ")}
          >
            Todos
          </button>
          {decks.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSetReviewDeckId(d.id)}
              className={[
                "max-w-[200px] truncate rounded-full px-4 py-2 text-sm font-semibold transition",
                reviewDeckId === d.id
                  ? "bg-[#6C3FC5] text-white shadow-md"
                  : "border border-neutral-200 bg-white text-[#1A1A2E] hover:border-[#6C3FC5] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
              ].join(" ")}
              title={d.full_path ?? d.nome}
            >
              {d.full_path ?? d.nome}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {dueCards.map((c, i) => {
            const u = urgencyForDueCard(c);
            const deckNome =
              decks.find((x) => x.id === c.deck_id)?.full_path ??
              decks.find((x) => x.id === c.deck_id)?.nome ??
              "Baralho";
            return (
              <li
                key={c.id}
                className="rounded-[10px] border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                style={{ boxShadow: FLASH_CARD_SHADOW }}
              >
                <p className={`text-xs font-semibold ${u.className}`}>{u.text}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">{deckNome}</p>
                <p className="mt-2 text-[15px] font-bold leading-snug text-[#1A1A2E] dark:text-neutral-100">
                  {stripHtml(c.frente) || "(sem conteúdo)"}
                </p>
                <button
                  type="button"
                  onClick={() => onStartSession(i)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto sm:px-6"
                  style={{ backgroundColor: FLASH_PRIMARY }}
                >
                  Revisar agora
                  <span aria-hidden>→</span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onStartSession(0)}
          className="fixed bottom-8 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:brightness-110 md:right-10"
          style={{ backgroundColor: FLASH_PRIMARY, boxShadow: "0 8px 28px rgba(108,63,197,0.45)" }}
        >
          <Play className="h-4 w-4 fill-current" />
          Iniciar sessão completa
          <span className="rounded-full bg-white/20 px-2 py-0.5 tabular-nums text-xs">
            {dueCards.length} cartões
          </span>
        </button>
      </div>
    </div>
  );
}
