import React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Library, Sparkles, SlidersHorizontal } from "lucide-react";

import { toast } from "sonner";

import { api } from "@/services/api";

import { DeckFormModal } from "@/components/flashcards/DeckFormModal";

import { CardFormModal } from "@/components/flashcards/CardFormModal";

import { ImportApkgModal } from "@/components/flashcards/ImportApkgModal";

import { FlashcardsStatsHeader } from "@/components/flashcards/FlashcardsStatsHeader";

import { FlashcardsTabNav } from "@/components/flashcards/FlashcardsTabNav";

import { FlashcardsConfigTab } from "@/components/flashcards/FlashcardsConfigTab";

import { FlashcardsDecksTab } from "@/components/flashcards/FlashcardsDecksTab";

import { FlashcardsReviewTab } from "@/components/flashcards/FlashcardsReviewTab";

import {
  ANKI_DEFAULTS,
  STREAK_DECK_PREFIX,
  STREAK_GLOBAL_KEY,
} from "@/lib/flashcards/constants";

import {
  dirtyFlashcardConfigFields,
  validateFlashcardConfig,
} from "@/lib/flashcards/configValidation";

import type {
  Deck,
  Flashcard,
  FlashcardConfig,
  FlashcardsMetrics,
  FlashcardsTab,
  FlashcardsView,
} from "@/lib/flashcards/types";

import {
  bumpStreakState,
  readStreak,
  writeStreak,
} from "@/lib/flashcards/utils";

/* ─── Main page ───────────────────────────────────────────────────────────── */

export function Flashcards() {
  const qc = useQueryClient();

  const [tab, setTab] = React.useState<FlashcardsTab>("baralhos");

  const [view, setView] = React.useState<FlashcardsView>("decks");

  const [selectedDeck, setSelectedDeck] = React.useState<Deck | null>(null);

  /* modals */

  const [deckModal, setDeckModal] = React.useState<{
    open: boolean;
    deck?: Deck | null;
  }>({ open: false });

  const [cardModal, setCardModal] = React.useState<{
    open: boolean;
    card?: Flashcard | null;
  }>({ open: false });

  const [importOpen, setImportOpen] = React.useState(false);

  /* review state */

  const [reviewDeckId, setReviewDeckId] = React.useState<string | null>(null);

  const [reviewIdx, setReviewIdx] = React.useState(0);

  const [flipped, setFlipped] = React.useState(false);

  const [reviewDone, setReviewDone] = React.useState(0);

  const [reviewSessionActive, setReviewSessionActive] = React.useState(false);

  const [sessionStartTs, setSessionStartTs] = React.useState<number | null>(
    null,
  );

  const [sessionStats, setSessionStats] = React.useState({
    correct: 0,
    wrong: 0,
  });

  /* config accordion */

  const [cfgSections, setCfgSections] = React.useState({
    limits: true,
    algorithm: false,
    penalties: false,
  });

  /* config state */

  const [configDraft, setConfigDraft] = React.useState<
    Partial<FlashcardConfig>
  >({});

  const [streakRev, setStreakRev] = React.useState(0);

  /* ── Queries ── */

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

    queryFn: async () =>
      (await api.get("/flashcards/metrics")).data as FlashcardsMetrics,
  });

  const deckMetrics = metrics?.decks ?? [];

  const dueTodayTotal = metrics?.due_today_total ?? 0;

  const totalCardsGlobal = metrics?.total_cards ?? 0;

  const globalStreak = React.useMemo(
    () => readStreak(STREAK_GLOBAL_KEY).count,

    [streakRev],
  );

  const avgDominio =
    deckMetrics.length > 0
      ? Math.round(
          deckMetrics.reduce((a, d) => a + d.dominio_pct, 0) /
            deckMetrics.length,
        )
      : 0;

  const { data: deckCards = [] } = useQuery({
    queryKey: ["flashcards-cards", selectedDeck?.id],

    enabled: Boolean(selectedDeck),

    queryFn: async () =>
      (await api.get(`/flashcards?deck_id=${selectedDeck!.id}&include_subdecks=true`))
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

  const { data: cfgData, refetch: refetchCfg } = useQuery({
    queryKey: ["flashcards-config"],

    queryFn: async () =>
      (await api.get("/flashcards/config")).data as FlashcardConfig,

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
      qc.invalidateQueries({ queryKey: ["flashcards-decks-flat"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-tree"] });

      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });

      toast.success("Baralho excluído.");

      setView("decks");
      setSelectedDeck(null);
    },
  });

  const deleteAllDecksMutation = useMutation({
    mutationFn: async () => (await api.delete("/flashcards/decks")).data as { decks_removidos: number },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-flat"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-tree"] });
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      setView("decks");
      setSelectedDeck(null);
      toast.success(
        data.decks_removidos > 0
          ? `${data.decks_removidos} baralho(s) removido(s).`
          : "Nenhum baralho para remover.",
      );
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/flashcards/${id}`),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["flashcards-cards", selectedDeck?.id],
      });

      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-flat"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-tree"] });

      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });

      toast.success("Cartão excluído.");
    },
  });

  const responderMutation = useMutation({
    mutationFn: async ({
      cardId,
      label,
    }: {
      cardId: string;
      label: string;
      deckId?: string;
    }) => api.post(`/flashcards/${cardId}/responder`, { label }),

    onSuccess: (_data, vars) => {
      setFlipped(false);

      setReviewDone((n) => n + 1);

      setReviewIdx((i) => i + 1);

      setSessionStats((s) =>
        vars.label === "errei"
          ? { ...s, wrong: s.wrong + 1 }
          : { ...s, correct: s.correct + 1 },
      );

      const today = new Date().toISOString().slice(0, 10);

      const g = readStreak(STREAK_GLOBAL_KEY);

      writeStreak(
        STREAK_GLOBAL_KEY,
        bumpStreakState(g.lastYmd, g.count, today),
      );

      if (vars.deckId) {
        const dk = `${STREAK_DECK_PREFIX}${vars.deckId}`;

        const d = readStreak(dk);

        writeStreak(dk, bumpStreakState(d.lastYmd, d.count, today));
      }

      setStreakRev((x) => x + 1);

      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });

      qc.invalidateQueries({ queryKey: ["flashcards-due", reviewDeckId] });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => api.put("/flashcards/config", configDraft),

    onSuccess: () => {
      refetchCfg();

      toast.success("Configurações salvas!");
    },

    onError: () => toast.error("Erro ao salvar configurações."),
  });

  const savedCfg = cfgData ?? ANKI_DEFAULTS;

  const configErrors = React.useMemo(
    () => validateFlashcardConfig(configDraft),

    [configDraft],
  );

  const configDirtyFields = React.useMemo(
    () => dirtyFlashcardConfigFields(configDraft, savedCfg),

    [configDraft, savedCfg],
  );

  const configDirtyCount = configDirtyFields.length;

  /* reset review when deck changes / tab */

  React.useEffect(() => {
    setReviewIdx(0);

    setFlipped(false);

    setReviewDone(0);

    setReviewSessionActive(false);

    setSessionStartTs(null);

    setSessionStats({ correct: 0, wrong: 0 });
  }, [reviewDeckId, tab]);

  const dueCards = reviewQuery.data ?? [];

  const currentCard = dueCards[reviewIdx] ?? null;

  const cfg = cfgData ?? {
    novos_por_dia: 20,
    max_revisoes_dia: 100,

    intervalo_dificil_mult: 1.2,
    bonus_facil_mult: 1.3,

    facilidade_inicial: 2.5,
    facilidade_minima: 1.3,

    penalidade_dificil: 0.15,
    bonus_facilidade_facil: 0.15,
  };

  const reviewFocusMode = tab === "revisar" && reviewSessionActive;

  React.useEffect(() => {
    if (tab !== "revisar" || !reviewSessionActive || !currentCard) return;

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;

      if (!el) return;

      const tag = el.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      )
        return;

      if (e.key === " " || e.key === "Enter") {
        if (!flipped) {
          e.preventDefault();

          setFlipped(true);
        }
      }

      if (flipped && !responderMutation.isPending) {
        const map: Record<string, string> = {
          "1": "errei",
          "2": "dificil",
          "3": "bom",
          "4": "facil",
        };

        const label = map[e.key];

        if (label) {
          e.preventDefault();

          responderMutation.mutate({
            cardId: currentCard.id,

            label,

            deckId: currentCard.deck_id,
          });
        }
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [tab, reviewSessionActive, currentCard, flipped, responderMutation]);

  const deckStreakCount = React.useCallback(
    (deckId: string) => readStreak(`${STREAK_DECK_PREFIX}${deckId}`).count,

    [streakRev],
  );

  const resetReviewSession = React.useCallback(() => {
    setReviewIdx(0);

    setFlipped(false);

    setReviewDone(0);

    setSessionStartTs(null);

    setSessionStats({ correct: 0, wrong: 0 });
  }, []);

  const startReviewSession = React.useCallback((startIdx: number) => {
    setReviewIdx(startIdx);

    setReviewSessionActive(true);

    setFlipped(false);

    setReviewDone(0);

    setSessionStartTs(Date.now());

    setSessionStats({ correct: 0, wrong: 0 });
  }, []);

  /* ── Tab bar ── */

  const TABS: { id: FlashcardsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "baralhos",
      label: "Meus Baralhos",
      icon: <Library className="h-5 w-5 shrink-0" strokeWidth={2} />,
    },

    {
      id: "revisar",
      label: "Revisar Hoje",
      icon: <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2} />,
    },

    {
      id: "config",
      label: "Configurações",
      icon: <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2} />,
    },
  ];

  return (
    <div className="-m-6 min-h-full bg-background p-4 text-foreground sm:p-6">
      <div
        className={
          reviewFocusMode
            ? "mx-auto w-full max-w-[780px] space-y-4 px-4 pb-6 pt-2"
            : "mx-auto max-w-6xl space-y-4 pb-6"
        }
      >
        {!reviewFocusMode ? (
          <FlashcardsStatsHeader
            totalCardsGlobal={totalCardsGlobal}
            globalStreak={globalStreak}
            dueTodayTotal={dueTodayTotal}
            avgDominio={avgDominio}
            showDeckMetrics={deckMetrics.length > 0}
          />
        ) : null}

        {!reviewFocusMode ? (
          <FlashcardsTabNav
            tabs={TABS}
            activeTab={tab}
            dueTodayTotal={dueTodayTotal}
            onTabChange={(t) => {
              setTab(t);
              setView("decks");
            }}
          />
        ) : null}

        {tab === "baralhos" ? (
          <FlashcardsDecksTab
            view={view}
            decks={deckFlat}
            treeDecks={deckTree}
            deckMetrics={deckMetrics}
            selectedDeck={selectedDeck}
            deckCards={deckCards}
            deckStreakCount={deckStreakCount}
            onOpenDeckModal={(deck) => setDeckModal({ open: true, deck })}
            onOpenImport={() => setImportOpen(true)}
            onDeleteDeck={(id) => deleteDeckMutation.mutate(id)}
            onDeleteAllDecks={() => deleteAllDecksMutation.mutate()}
            deletingAll={deleteAllDecksMutation.isPending}
            onSelectDeck={(deck) => {
              setSelectedDeck(deck);
              setView("deck-detail");
            }}
            onBackToDecks={() => {
              setView("decks");
              setSelectedDeck(null);
            }}
            onOpenCardModal={(card) => setCardModal({ open: true, card })}
            onDeleteCard={(id) => deleteCardMutation.mutate(id)}
            onStartReview={(deckId) => {
              setReviewDeckId(deckId);

              setTab("revisar");
            }}
          />
        ) : null}

        {tab === "revisar" ? (
          <FlashcardsReviewTab
            isLoading={reviewQuery.isLoading}
            dueCards={dueCards}
            decks={deckFlat}
            deckMetrics={deckMetrics}
            totalCardsGlobal={totalCardsGlobal}
            dueTodayTotal={dueTodayTotal}
            reviewDeckId={reviewDeckId}
            reviewIdx={reviewIdx}
            flipped={flipped}
            reviewDone={reviewDone}
            reviewSessionActive={reviewSessionActive}
            sessionStartTs={sessionStartTs}
            sessionStats={sessionStats}
            currentCard={currentCard}
            cfg={cfg}
            responderPending={responderMutation.isPending}
            onSetReviewDeckId={setReviewDeckId}
            onSetFlipped={setFlipped}
            onRespond={(params) => responderMutation.mutate(params)}
            onRefetch={() => reviewQuery.refetch()}
            onGoToConfig={() => {
              setTab("config");
              setView("decks");
            }}
            onGoToBaralhos={() => {
              setTab("baralhos");
              setView("decks");
            }}
            onStartSession={startReviewSession}
            onExitSession={() => {
              setReviewSessionActive(false);

              resetReviewSession();

              reviewQuery.refetch();
            }}
            onRestartSession={() => {
              resetReviewSession();

              setSessionStartTs(Date.now());

              reviewQuery.refetch();
            }}
            onCompleteSessionGoToBaralhos={() => {
              setReviewSessionActive(false);

              resetReviewSession();

              setTab("baralhos");

              setView("decks");

              reviewQuery.refetch();
            }}
          />
        ) : null}

        {tab === "config" ? (
          <FlashcardsConfigTab
            loading={!cfgData}
            configDraft={configDraft}
            configErrors={configErrors}
            configDirtyFields={configDirtyFields}
            configDirtyCount={configDirtyCount}
            cfgSections={cfgSections}
            saving={saveConfigMutation.isPending}
            onToggleSection={(section) =>
              setCfgSections((s) => ({ ...s, [section]: !s[section] }))
            }
            onConfigChange={(patch) =>
              setConfigDraft((d) => ({ ...d, ...patch }))
            }
            onRestoreDefaults={() => setConfigDraft({ ...ANKI_DEFAULTS })}
            onSave={() => saveConfigMutation.mutate()}
          />
        ) : null}
      </div>

      <DeckFormModal
        open={deckModal.open}
        onClose={() => setDeckModal({ open: false })}
        deck={deckModal.deck}
        flatDecks={deckFlat}
      />

      <ImportApkgModal open={importOpen} onClose={() => setImportOpen(false)} />

      <CardFormModal
        open={cardModal.open}
        onClose={() => setCardModal({ open: false })}
        deckId={selectedDeck?.id ?? ""}
        deckName={selectedDeck?.nome}
        card={cardModal.card}
        decks={deckFlat.map((d) => ({ id: d.id, nome: d.nome, full_path: d.full_path }))}
        onDeckChange={(id) => {
          const d = deckFlat.find((x) => x.id === id);

          if (d) setSelectedDeck(d);
        }}
      />
    </div>
  );
}
