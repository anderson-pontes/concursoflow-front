import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Layers, Plus, ChevronLeft, Pencil, Trash2, Play,
  RotateCcw, Settings2, BookOpen, CreditCard, CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { DeckFormModal } from "@/components/flashcards/DeckFormModal";
import { CardFormModal } from "@/components/flashcards/CardFormModal";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Deck = {
  id: string; nome: string; disciplina_id: string | null;
  descricao: string | null; cor_hex: string | null;
  total_cards: number; created_at: string;
};
type Flashcard = {
  id: string; deck_id: string; frente: string; verso: string;
  imagem_frente_url: string | null; imagem_verso_url: string | null;
  tags: string[] | null; intervalo: number; facilidade: number;
  repeticoes: number; proxima_revisao: string; ultima_revisao: string | null;
  created_at: string;
};
type FlashcardConfig = {
  novos_por_dia: number; max_revisoes_dia: number;
  intervalo_dificil_mult: number; bonus_facil_mult: number;
  facilidade_inicial: number; facilidade_minima: number;
  penalidade_dificil: number; bonus_facilidade_facil: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function previewIntervalos(card: Flashcard, cfg: FlashcardConfig) {
  const { intervalo, facilidade, repeticoes } = card;
  const f = Number(facilidade);
  const errei = 1;
  const dificil = repeticoes === 0 ? 1 : Math.max(2, Math.round(intervalo * cfg.intervalo_dificil_mult));
  const bom = repeticoes === 0 ? 1 : repeticoes === 1 ? 6 : Math.max(2, Math.round(intervalo * f));
  const facil = repeticoes <= 1 ? 4 : Math.max(4, Math.round(intervalo * f * cfg.bonus_facil_mult));
  return { errei, dificil, bom, facil };
}

function fmtDias(d: number) {
  if (d === 0) return "agora";
  if (d === 1) return "1 dia";
  if (d < 30) return `${d} dias`;
  if (d < 365) return `${Math.round(d / 30)} meses`;
  return `${Math.round(d / 365)} anos`;
}

/* ─── Stats badge for deck ────────────────────────────────────────────────── */
function DueBadge({ deckId, stats }: { deckId: string; stats: { deck_id: string; vencidos: number }[] }) {
  const found = stats.find((s) => s.deck_id === deckId);
  if (!found || found.vencidos === 0) return null;
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold text-white">
      {found.vencidos}
    </span>
  );
}

/* ─── Flip card ───────────────────────────────────────────────────────────── */
function FlipCard({ card, flipped }: { card: Flashcard; flipped: boolean }) {
  return (
    <div style={{ perspective: "1200px" }} className="w-full">
      {/*
        Grid trick: both faces sit in the same grid cell (1/1),
        so the container height = max(frente height, verso height).
        This allows images / tall content without fixed height.
      */}
      <div
        style={{
          display: "grid",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Frente */}
        <div
          style={{
            gridArea: "1/1",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <p className="mb-3 shrink-0 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Frente
          </p>
          <div
            className="flashcard-content prose prose-sm dark:prose-invert max-w-none"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: card.frente }}
          />
        </div>

        {/* Verso */}
        <div
          style={{
            gridArea: "1/1",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className="flex flex-col rounded-2xl border border-primary-200 bg-primary-50/50 p-6 shadow-sm dark:border-primary-800 dark:bg-primary-950/30"
        >
          <p className="mb-3 shrink-0 text-center text-[10px] font-bold uppercase tracking-widest text-primary-500">
            Verso
          </p>
          <div
            className="flashcard-content prose prose-sm dark:prose-invert max-w-none"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: card.verso }}
          />
        </div>
      </div>

      {/* Global styles for flashcard content */}
      <style>{`
        .flashcard-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
          margin: 6px auto;
        }
        .flashcard-content p { margin: 0 0 0.4em; }
        .flashcard-content ul { list-style: disc; padding-left: 1.4em; }
        .flashcard-content ol { list-style: decimal; padding-left: 1.4em; }
      `}</style>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
type Tab = "baralhos" | "revisar" | "config";
type View = "decks" | "deck-detail";

export function Flashcards() {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>("baralhos");
  const [view, setView] = React.useState<View>("decks");
  const [selectedDeck, setSelectedDeck] = React.useState<Deck | null>(null);

  /* modals */
  const [deckModal, setDeckModal] = React.useState<{ open: boolean; deck?: Deck | null }>({ open: false });
  const [cardModal, setCardModal] = React.useState<{ open: boolean; card?: Flashcard | null }>({ open: false });

  /* review state */
  const [reviewDeckId, setReviewDeckId] = React.useState<string | null>(null);
  const [reviewIdx, setReviewIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [reviewDone, setReviewDone] = React.useState(0);

  /* config state */
  const [configDraft, setConfigDraft] = React.useState<Partial<FlashcardConfig>>({});

  /* ── Queries ── */
  const { data: decks = [] } = useQuery({
    queryKey: ["flashcards-decks"],
    queryFn: async () => (await api.get("/flashcards/decks")).data as Deck[],
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["flashcards-stats"],
    queryFn: async () => (await api.get("/flashcards/stats")).data as { deck_id: string; vencidos: number }[],
  });

  const { data: deckCards = [] } = useQuery({
    queryKey: ["flashcards-cards", selectedDeck?.id],
    enabled: Boolean(selectedDeck),
    queryFn: async () =>
      (await api.get(`/flashcards?deck_id=${selectedDeck!.id}`)).data as Flashcard[],
  });

  const reviewQuery = useQuery({
    queryKey: ["flashcards-due", reviewDeckId],
    enabled: tab === "revisar",
    queryFn: async () => {
      const url = reviewDeckId
        ? `/flashcards/revisar?limit=100&deck_id=${reviewDeckId}`
        : "/flashcards/revisar?limit=100";
      return (await api.get(url)).data as Flashcard[];
    },
  });

  const { data: cfgData, refetch: refetchCfg } = useQuery({
    queryKey: ["flashcards-config"],
    queryFn: async () => (await api.get("/flashcards/config")).data as FlashcardConfig,
    enabled: tab === "config",
  });

  React.useEffect(() => {
    if (cfgData) setConfigDraft(cfgData);
  }, [cfgData]);

  /* ── Mutations ── */
  const deleteDeckMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/flashcards/decks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-stats"] });
      toast.success("Baralho excluído.");
      setView("decks"); setSelectedDeck(null);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/flashcards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards-cards", selectedDeck?.id] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      toast.success("Cartão excluído.");
    },
  });

  const responderMutation = useMutation({
    mutationFn: async ({ cardId, label }: { cardId: string; label: string }) =>
      api.post(`/flashcards/${cardId}/responder`, { label }),
    onSuccess: () => {
      setFlipped(false);
      setReviewDone((n) => n + 1);
      setReviewIdx((i) => i + 1);
      qc.invalidateQueries({ queryKey: ["flashcards-stats"] });
      qc.invalidateQueries({ queryKey: ["flashcards-due", reviewDeckId] });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => api.put("/flashcards/config", configDraft),
    onSuccess: () => { refetchCfg(); toast.success("Configurações salvas!"); },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  /* reset review when deck changes */
  React.useEffect(() => {
    setReviewIdx(0); setFlipped(false); setReviewDone(0);
  }, [reviewDeckId, tab]);

  const dueCards = reviewQuery.data ?? [];
  const currentCard = dueCards[reviewIdx] ?? null;
  const cfg = cfgData ?? {
    novos_por_dia: 20, max_revisoes_dia: 100,
    intervalo_dificil_mult: 1.2, bonus_facil_mult: 1.3,
    facilidade_inicial: 2.5, facilidade_minima: 1.3,
    penalidade_dificil: 0.15, bonus_facilidade_facil: 0.15,
  };

  /* ── Tab bar ── */
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "baralhos", label: "Meus Baralhos", icon: <Layers className="h-4 w-4" /> },
    { id: "revisar", label: "Revisar Hoje", icon: <Play className="h-4 w-4" /> },
    { id: "config", label: "Configurações", icon: <Settings2 className="h-4 w-4" /> },
  ];

  /* ──────────────────────────────────────────────────────────────────────── */
  /* RENDER                                                                   */
  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Flashcards
          </h1>
          <p className="text-sm text-muted-foreground">
            Revisão espaçada com algoritmo estilo Anki.
          </p>
        </div>
        {tab === "baralhos" && view === "decks" ? (
          <button
            type="button"
            onClick={() => setDeckModal({ open: true, deck: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Novo baralho
          </button>
        ) : null}
        {tab === "baralhos" && view === "deck-detail" && selectedDeck ? (
          <button
            type="button"
            onClick={() => setCardModal({ open: true, card: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Novo cartão
          </button>
        ) : null}
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setView("decks"); }}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground",
            ].join(" ")}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === "revisar" ? (
              <span className={[
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                stats.reduce((a, s) => a + s.vencidos, 0) > 0
                  ? "bg-danger-500 text-white"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}>
                {stats.reduce((a, s) => a + s.vencidos, 0)}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── TAB: Baralhos ── */}
      {tab === "baralhos" ? (
        view === "decks" ? (
          /* Deck grid */
          <div>
            {decks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <Layers className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum baralho criado ainda.</p>
                <button
                  type="button"
                  onClick={() => setDeckModal({ open: true })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro baralho
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
                    style={{ borderTop: `4px solid ${deck.cor_hex ?? "#6366f1"}` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-card-foreground">
                            {deck.nome}
                          </h3>
                          <DueBadge deckId={deck.id} stats={stats} />
                        </div>
                        {deck.descricao ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{deck.descricao}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setDeckModal({ open: true, deck })}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Excluir o baralho "${deck.nome}"? Todos os cartões serão removidos.`))
                              deleteDeckMutation.mutate(deck.id);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-50 hover:text-danger-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {deck.total_cards} cartões
                      </span>
                      {(() => {
                        const due = stats.find((s) => s.deck_id === deck.id)?.vencidos ?? 0;
                        return due > 0 ? (
                          <span className="flex items-center gap-1 text-danger-500">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {due} para revisar
                          </span>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedDeck(deck); setView("deck-detail"); }}
                        className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-card-foreground hover:bg-muted"
                      >
                        Ver cartões
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewDeckId(deck.id);
                          setTab("revisar");
                        }}
                        className="flex-1 rounded-xl py-2 text-xs font-semibold text-white"
                        style={{ background: deck.cor_hex ?? "#6366f1" }}
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Deck detail — card list */
          <div className="space-y-4">
            {/* Back + deck info */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setView("decks"); setSelectedDeck(null); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Baralhos
              </button>
              <div>
                <h2 className="text-base font-bold text-card-foreground">{selectedDeck?.nome}</h2>
                <p className="text-xs text-muted-foreground">{deckCards.length} cartões</p>
              </div>
            </div>

            {deckCards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum cartão neste baralho.</p>
                <button
                  type="button"
                  onClick={() => setCardModal({ open: true })}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Criar primeiro cartão
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {deckCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className={[
                      "group flex items-center gap-4 px-5 py-4 hover:bg-muted/30",
                      idx !== 0 ? "border-t border-border" : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {stripHtml(card.frente) || "(sem conteúdo)"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {stripHtml(card.verso)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Rep: {card.repeticoes}</span>
                        <span>•</span>
                        <span>Facilidade: {Number(card.facilidade).toFixed(2)}</span>
                        <span>•</span>
                        <span>Próxima: {card.proxima_revisao}</span>
                        {card.tags?.map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setCardModal({ open: true, card })}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Excluir este cartão?"))
                            deleteCardMutation.mutate(card.id);
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-50 hover:text-danger-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : null}

      {/* ── TAB: Revisar ── */}
      {tab === "revisar" ? (
        <div className="space-y-4">
          {/* Deck filter */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium text-card-foreground">Baralho:</span>
            <select
              className="flex-1 bg-transparent text-sm text-card-foreground outline-none"
              value={reviewDeckId ?? ""}
              onChange={(e) => { setReviewDeckId(e.target.value || null); setReviewIdx(0); setFlipped(false); setReviewDone(0); }}
            >
              <option value="">Todos os baralhos</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          {reviewQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : dueCards.length === 0 ? (
            /* All done */
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-950/40">
                <CheckCircle2 className="h-8 w-8 text-success-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-card-foreground">Parabéns!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nenhum cartão para revisar agora. Volte mais tarde.
                </p>
              </div>
              <button
                type="button"
                onClick={() => reviewQuery.refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          ) : reviewIdx >= dueCards.length ? (
            /* Session done */
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950/40">
                <CheckCircle2 className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-card-foreground">Sessão concluída!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você revisou {reviewDone} cartão{reviewDone !== 1 ? "s" : ""} nesta sessão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setReviewIdx(0); setFlipped(false); setReviewDone(0); reviewQuery.refetch(); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <RotateCcw className="h-4 w-4" />
                Reiniciar
              </button>
            </div>
          ) : (
            /* Active review */
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${(reviewIdx / dueCards.length) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {reviewIdx} / {dueCards.length}
                </span>
              </div>

              {/* Card flip */}
              <div
                className="cursor-pointer select-none"
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setFlipped((f) => !f); }}
                aria-label={flipped ? "Mostrar frente" : "Mostrar verso"}
              >
                {currentCard ? <FlipCard card={currentCard} flipped={flipped} /> : null}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Clique no cartão para {flipped ? "ver a frente" : "revelar o verso"}
              </p>

              {/* Answer buttons — only after flip */}
              {flipped && currentCard ? (
                <div className="space-y-3">
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Como foi?
                  </p>
                  {(() => {
                    const prev = previewIntervalos(currentCard, cfg);
                    const buttons: { label: string; key: string; color: string; bg: string }[] = [
                      { label: "Errei", key: "errei", color: "#dc2626", bg: "#fef2f2" },
                      { label: "Difícil", key: "dificil", color: "#ea580c", bg: "#fff7ed" },
                      { label: "Bom", key: "bom", color: "#2563eb", bg: "#eff6ff" },
                      { label: "Fácil", key: "facil", color: "#16a34a", bg: "#f0fdf4" },
                    ];
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {buttons.map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            disabled={responderMutation.isPending}
                            onClick={() => responderMutation.mutate({ cardId: currentCard.id, label: btn.key })}
                            className="flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                            style={{
                              borderColor: btn.color,
                              color: btn.color,
                              background: btn.bg,
                            }}
                          >
                            {btn.label}
                            <span className="text-[10px] font-normal opacity-70">
                              {fmtDias(prev[btn.key as keyof typeof prev])}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 opacity-30 pointer-events-none">
                  {["Errei", "Difícil", "Bom", "Fácil"].map((l) => (
                    <div key={l} className="rounded-xl border-2 border-border px-2 py-3 text-center text-sm font-bold text-muted-foreground">
                      {l}
                    </div>
                  ))}
                </div>
              )}

              {/* Card meta */}
              {currentCard ? (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span>Repetições: {currentCard.repeticoes}</span>
                  <span>•</span>
                  <span>Facilidade: {Number(currentCard.facilidade).toFixed(2)}</span>
                  <span>•</span>
                  <span>Intervalo atual: {currentCard.intervalo} dias</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* ── TAB: Configurações ── */}
      {tab === "config" ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-card-foreground">Configuração de Repetição Espaçada</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Ajuste os parâmetros do algoritmo. Os valores padrão seguem o padrão Anki.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Novos por dia */}
              <ConfigField
                label="Novos cartões por dia"
                desc="Quantidade máxima de cartões novos apresentados por dia."
                anki="20"
                value={configDraft.novos_por_dia ?? 20}
                onChange={(v) => setConfigDraft((d) => ({ ...d, novos_por_dia: v }))}
                min={1} max={9999} step={1}
              />
              {/* Max revisões */}
              <ConfigField
                label="Máximo de revisões por dia"
                desc="Limite de revisões totais (novos + pendentes) por dia."
                anki="100"
                value={configDraft.max_revisoes_dia ?? 100}
                onChange={(v) => setConfigDraft((d) => ({ ...d, max_revisoes_dia: v }))}
                min={1} max={9999} step={1}
              />
              {/* Dificil mult */}
              <ConfigField
                label="Multiplicador Difícil"
                desc="O intervalo é multiplicado por este valor ao marcar Difícil."
                anki="1.2"
                value={configDraft.intervalo_dificil_mult ?? 1.2}
                onChange={(v) => setConfigDraft((d) => ({ ...d, intervalo_dificil_mult: v }))}
                min={1} max={5} step={0.05} decimal
              />
              {/* Fácil bonus */}
              <ConfigField
                label="Bônus Fácil"
                desc="Multiplicador adicional ao intervalo quando marcado Fácil."
                anki="1.3"
                value={configDraft.bonus_facil_mult ?? 1.3}
                onChange={(v) => setConfigDraft((d) => ({ ...d, bonus_facil_mult: v }))}
                min={1} max={5} step={0.05} decimal
              />
              {/* Facilidade inicial */}
              <ConfigField
                label="Facilidade inicial"
                desc="Fator de facilidade dos novos cartões (EF). Padrão Anki: 2.5"
                anki="2.5"
                value={configDraft.facilidade_inicial ?? 2.5}
                onChange={(v) => setConfigDraft((d) => ({ ...d, facilidade_inicial: v }))}
                min={1.3} max={9.9} step={0.1} decimal
              />
              {/* Facilidade mínima */}
              <ConfigField
                label="Facilidade mínima"
                desc="O EF nunca cai abaixo deste valor, evitando intervalos muito curtos."
                anki="1.3"
                value={configDraft.facilidade_minima ?? 1.3}
                onChange={(v) => setConfigDraft((d) => ({ ...d, facilidade_minima: v }))}
                min={1} max={5} step={0.1} decimal
              />
              {/* Penalidade difícil */}
              <ConfigField
                label="Penalidade Difícil (EF)"
                desc="Redução na facilidade ao marcar Difícil."
                anki="0.15"
                value={configDraft.penalidade_dificil ?? 0.15}
                onChange={(v) => setConfigDraft((d) => ({ ...d, penalidade_dificil: v }))}
                min={0} max={1} step={0.01} decimal
              />
              {/* Bônus facilidade fácil */}
              <ConfigField
                label="Bônus Fácil (EF)"
                desc="Aumento na facilidade ao marcar Fácil."
                anki="0.15"
                value={configDraft.bonus_facilidade_facil ?? 0.15}
                onChange={(v) => setConfigDraft((d) => ({ ...d, bonus_facilidade_facil: v }))}
                min={0} max={1} step={0.01} decimal
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setConfigDraft({
                  novos_por_dia: 20, max_revisoes_dia: 100,
                  intervalo_dificil_mult: 1.2, bonus_facil_mult: 1.3,
                  facilidade_inicial: 2.5, facilidade_minima: 1.3,
                  penalidade_dificil: 0.15, bonus_facilidade_facil: 0.15,
                })}
                className="text-sm text-muted-foreground underline hover:text-card-foreground"
              >
                Restaurar padrão Anki
              </button>
              <button
                type="button"
                disabled={saveConfigMutation.isPending}
                onClick={() => saveConfigMutation.mutate()}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {saveConfigMutation.isPending ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-card-foreground">Como funciona o algoritmo?</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><span className="font-medium text-danger-500">Errei</span> — Reinicia o cartão: intervalo = 1 dia, facilidade −0.20</li>
              <li><span className="font-medium text-orange-500">Difícil</span> — Intervalo × Mult.Difícil, facilidade −Penalidade</li>
              <li><span className="font-medium text-blue-500">Bom</span> — Intervalo × Facilidade (SM-2 padrão)</li>
              <li><span className="font-medium text-success-500">Fácil</span> — Intervalo × Facilidade × Bônus Fácil, facilidade +Bônus EF</li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* ── Modals ── */}
      <DeckFormModal
        open={deckModal.open}
        onClose={() => setDeckModal({ open: false })}
        deck={deckModal.deck}
      />
      <CardFormModal
        open={cardModal.open}
        onClose={() => setCardModal({ open: false })}
        deckId={selectedDeck?.id ?? ""}
        card={cardModal.card}
      />
    </div>
  );
}

/* ─── Config field component ──────────────────────────────────────────────── */
function ConfigField({
  label, desc, anki, value, onChange, min, max, step, decimal,
}: {
  label: string; desc: string; anki: string;
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; decimal?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-card-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">Anki: {anki}</span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={decimal ? value.toFixed(step < 0.05 ? 2 : step < 0.5 ? 2 : 1) : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
      />
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
