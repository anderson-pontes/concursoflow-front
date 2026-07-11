import { RotateCcw, CheckCircle2, Play } from "lucide-react";

import { FLASH_CARD_SHADOW } from "@/lib/flashcards/constants";
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
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando pendências…</div>
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
            <svg viewBox="0 0 140 110" className="h-full w-full text-primary">
              <rect x="12" y="24" width="88" height="62" rx="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
              <rect x="32" y="14" width="88" height="62" rx="10" fill="white" stroke="currentColor" strokeWidth="2" className="dark:fill-neutral-800" />
              <path d="M48 44h56M48 54h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
            </svg>
            <div className="absolute bottom-2 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-success text-white fc-check-bounce shadow-lg">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-neutral-100">Tudo em dia! 🎉</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-neutral-400">
              Você revisou todos os cartões programados para hoje.
            </p>
          </div>
          <div
            className="w-full rounded-[10px] border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-foreground dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-neutral-200"
          >
            <p className="font-medium">{nextLine}</p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-neutral-400">
              <span className="tabular-nums font-semibold text-primary">{restantes}</span>
              {" "}cartões ativos nos seus baralhos
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onGoToConfig}
              className="rounded-[10px] border-2 border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            >
              Revisar no avançado
            </button>
            <button
              type="button"
              onClick={onGoToBaralhos}
              className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 bg-primary"
            >
              Ver meus baralhos
            </button>
          </div>
          <button
            type="button"
            onClick={onRefetch}
            className="inline-flex items-center gap-2 rounded-[10px] border-2 border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-violet-50 dark:bg-neutral-800 dark:hover:bg-violet-950/40"
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
            <h2 className="text-[22px] font-bold text-foreground">Sessão concluída! 🎉</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você revisou todos os{" "}
              <span className="tabular-nums font-semibold text-foreground">{reviewDone}</span> cartões de hoje.
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
              className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors duration-200 ease-out hover:bg-muted"
            >
              Ver meus baralhos
            </button>
            <button
              type="button"
              onClick={onRestartSession}
              className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-primary-700"
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
        <div className="space-y-0">
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
              className="shrink-0 border-0 bg-transparent p-0 text-left text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary"
            >
              ← Sair da sessão
            </button>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${dueCards.length ? (100 * reviewDone) / dueCards.length : 0}%`,
                  transition: "width 400ms ease",
                  background: "linear-gradient(90deg, var(--primary), var(--chart-2))",
                }}
              />
            </div>
            <p className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
              {reviewDone} de {dueCards.length} cartões
            </p>
          </div>

          {currentCard ? (
            <div
              className="flex flex-col justify-center rounded-[20px] bg-surface px-4 py-6 shadow-lg shadow-primary/10 sm:px-12 sm:py-10"
              style={{
                borderTop: "4px solid var(--primary)",
                minHeight: "min(52vh, 420px)",
              }}
            >
              <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">
                FRENTE
              </p>
              <div
                className="fc-review-card-content mx-auto max-w-full text-center text-[18px] font-medium leading-[1.8] text-foreground"
                style={{ overflowWrap: "break-word", fontWeight: 500 }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: currentCard.frente }}
              />

              <div className="my-6 border-t border-border" />

              {!flipped ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetFlipped(true)}
                    className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[12px] bg-primary px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary-700 hover:shadow-xl hover:shadow-primary/40"
                  >
                    <span aria-hidden>👁</span>
                    Revelar resposta
                  </button>
                  <p className="text-center text-[11px] text-muted-foreground">ou pressione Espaço / Enter</p>
                </div>
              ) : null}

              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-out"
                style={{ maxHeight: flipped ? 4000 : 0 }}
              >
                {flipped ? (
                  <div className="pt-2">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">VERSO</p>
                    <div
                      className="fc-review-card-content rounded-[12px] border-l-[3px] border-primary bg-surface-muted p-5 text-base leading-[1.8] text-foreground"
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
                            "border-2 border-destructive/20 bg-destructive/5 text-foreground hover:bg-destructive/10 hover:border-destructive hover:text-destructive",
                          subHover: "group-hover:text-destructive",
                        },
                        {
                          api: "dificil",
                          kbd: "2",
                          emoji: "😓",
                          title: "Difícil",
                          sub: fmtDias(prev.dificil),
                          className:
                            "border-2 border-warning/30 bg-warning/10 text-foreground hover:bg-warning/15 hover:border-warning hover:text-warning",
                          subHover: "group-hover:text-warning",
                        },
                        {
                          api: "bom",
                          kbd: "3",
                          emoji: "🙂",
                          title: "Bom",
                          sub: fmtDias(prev.bom),
                          className:
                            "border-2 border-blue-200 bg-blue-50 text-foreground hover:bg-blue-100 hover:border-blue-500 hover:text-blue-600",
                          subHover: "group-hover:text-blue-600",
                        },
                        {
                          api: "facil",
                          kbd: "4",
                          emoji: "😄",
                          title: "Fácil",
                          sub: fmtDias(prev.facil),
                          className:
                            "border-2 border-success/30 bg-success/10 text-foreground hover:bg-success/15 hover:border-success hover:text-success",
                          subHover: "group-hover:text-success",
                        },
                      ] as const;
                      return (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                              className={`group relative flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-[12px] px-2 py-4 transition-colors duration-150 ease-out disabled:opacity-60 ${b.className}`}
                            >
                              <span className="pointer-events-none absolute right-1.5 top-1.5 text-[10px] font-bold text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                {b.kbd}
                              </span>
                              <span className="text-2xl leading-none" aria-hidden>
                                {b.emoji}
                              </span>
                              <span className="text-sm font-semibold">{b.title}</span>
                              <span
                                className={`text-[11px] text-muted-foreground transition-colors duration-150 ${b.subHover}`}
                              >
                                {b.sub}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <p className="mt-4 text-center text-xs text-muted-foreground">
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
        <p className="text-sm text-muted-foreground dark:text-neutral-400">
          Escolha o baralho ou revise tudo de uma vez. Toque em um cartão para abrir só ele, ou inicie a sessão completa.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetReviewDeckId(null)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              reviewDeckId === null
                ? "bg-primary text-white shadow-md"
                : "border border-neutral-200 bg-white text-foreground hover:border-primary dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
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
                  ? "bg-primary text-white shadow-md"
                  : "border border-neutral-200 bg-white text-foreground hover:border-primary dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
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
                <p className="mt-1 text-xs text-muted-foreground">{deckNome}</p>
                <p className="mt-2 text-[15px] font-bold leading-snug text-foreground dark:text-neutral-100">
                  {stripHtml(c.frente) || "(sem conteúdo)"}
                </p>
                <button
                  type="button"
                  onClick={() => onStartSession(i)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto sm:px-6 bg-primary"
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
          className="fixed bottom-8 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-xl shadow-primary/40 transition hover:brightness-110 md:right-10"
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
