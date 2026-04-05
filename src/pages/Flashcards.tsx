import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Layers, Plus, Pencil, Trash2,
  RotateCcw, BookOpen, CheckCircle2,
  Library, Sparkles, SlidersHorizontal, TrendingUp,
  ChevronRight, Play, CalendarDays, Star, Clock, Info,
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

type DeckMetricRow = {
  deck_id: string;
  novos: number;
  aprendendo: number;
  vencidos: number;
  dominio_pct: number;
  proxima_futura: string | null;
};

type FlashcardsMetrics = {
  total_cards: number;
  due_today_total: number;
  decks: DeckMetricRow[];
};

const FLASH_PRIMARY = "#6C3FC5";
const FLASH_PAGE_BG = "#F5F4FA";
const FLASH_TEXT = "#1A1A2E";
const FLASH_MUTED = "#6B7280";
const FLASH_SUCCESS = "#22C55E";
const FLASH_DUE_BADGE = "#EA580C";
const FLASH_CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.07)";
const ANKI_DEFAULTS: FlashcardConfig = {
  novos_por_dia: 20,
  max_revisoes_dia: 100,
  intervalo_dificil_mult: 1.2,
  bonus_facil_mult: 1.3,
  facilidade_inicial: 2.5,
  facilidade_minima: 1.3,
  penalidade_dificil: 0.15,
  bonus_facilidade_facil: 0.15,
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

/** Status para listagem no baralho (prioridade: vencido > novo > dominado > aprendendo). */
function cardStudyStatus(card: Flashcard): "novo" | "aprendendo" | "dominado" | "vencido" {
  const today = todayYmd();
  const pr = card.proxima_revisao.slice(0, 10);
  if (pr < today) return "vencido";
  if (card.repeticoes === 0) return "novo";
  if (card.repeticoes >= 2 && card.intervalo >= 7) return "dominado";
  return "aprendendo";
}

function statusChipConfig(status: ReturnType<typeof cardStudyStatus>): {
  label: string;
  bg: string;
  text: string;
} {
  switch (status) {
    case "novo":
      return { label: "NOVO", bg: "#3B82F6", text: "#fff" };
    case "aprendendo":
      return { label: "APRENDENDO", bg: "#F59E0B", text: "#1A1A2E" };
    case "dominado":
      return { label: "DOMINADO", bg: "#22C55E", text: "#fff" };
    case "vencido":
      return { label: "VENCER", bg: "#EF4444", text: "#fff" };
  }
}

function formatProxBr(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!d || !m) return iso;
  return `${d}/${m}`;
}

function urgencyForDueCard(card: Flashcard): { text: string; className: string } {
  const today = todayYmd();
  const pr = card.proxima_revisao.slice(0, 10);
  if (pr < today) {
    const days = Math.max(
      1,
      Math.round(
        (new Date(`${today}T12:00:00`).getTime() - new Date(`${pr}T12:00:00`).getTime()) / 86400000,
      ),
    );
    return {
      text: `⚠️ Vencido há ${days} ${days === 1 ? "dia" : "dias"}`,
      className: "text-red-600 dark:text-red-400",
    };
  }
  if (card.repeticoes === 0) return { text: "🆕 Novo cartão", className: "text-blue-600 dark:text-blue-400" };
  return { text: "📅 Para hoje", className: "text-[#6C3FC5]" };
}

function earliestFutureReview(deckRows: DeckMetricRow[]): string | null {
  const dates = deckRows
    .map((r) => r.proxima_futura)
    .filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return dates.sort()[0];
}

function FlashCfgAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      style={{ boxShadow: FLASH_CARD_SHADOW }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-sm font-bold text-[#1A1A2E] transition hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-700/50"
      >
        <span>{title}</span>
        <ChevronRight
          className={`h-5 w-5 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-8 border-t border-neutral-100 px-4 py-5 dark:border-neutral-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FlashCfgIntRow({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  sliderMax,
  dirty,
  error,
  defaultVal,
  onChipReset,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  /** Limite visual do slider (pode ser menor que `max` do input numérico). */
  sliderMax?: number;
  dirty: boolean;
  error?: string;
  defaultVal: number;
  onChipReset: () => void;
}) {
  const sMax = sliderMax ?? max;
  const clampFull = (n: number) => {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.round(n)));
  };
  const sliderVal = Math.min(sMax, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        <label
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            dirty ? "text-[#6C3FC5]" : "text-[#1A1A2E] dark:text-neutral-100"
          }`}
        >
          {dirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#6C3FC5]" aria-hidden /> : null}
          {label}
        </label>
        <span className="cursor-help text-[#9CA3AF]" title={tooltip}>
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <button
          type="button"
          onClick={onChipReset}
          className="ml-auto rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-[#6C3FC5] transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:bg-violet-900/40"
        >
          Padrão Anki: {defaultVal}
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="range"
          min={min}
          max={sMax}
          value={sliderVal}
          onChange={(e) => onChange(clampFull(Number(e.target.value)))}
          className="h-2 flex-1 cursor-pointer accent-[#6C3FC5]"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : min}
          onChange={(e) => onChange(clampFull(Number(e.target.value)))}
          className={`w-full rounded-[10px] px-3 py-2.5 tabular-nums text-sm font-semibold outline-none sm:w-28 dark:bg-neutral-900 ${
            error
              ? "border-2 border-red-500"
              : dirty
                ? "border-2 border-[#6C3FC5]"
                : "border border-neutral-200 dark:border-neutral-600"
          }`}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-[#9CA3AF]">
        <span>{min}</span>
        <span>{sMax < max ? `${sMax} (slider)` : max}</span>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

function FlashCfgFloatRow({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step,
  dirty,
  error,
  decimals,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  dirty: boolean;
  error?: string;
  decimals: number;
}) {
  const clamp = (n: number) => {
    if (!Number.isFinite(n)) return min;
    const t = 10 ** decimals;
    const r = Math.round(n * t) / t;
    return Math.min(max, Math.max(min, r));
  };
  const safe = clamp(value);
  const steps = Math.round((max - min) / step);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            dirty ? "text-[#6C3FC5]" : "text-[#1A1A2E] dark:text-neutral-100"
          }`}
        >
          {dirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#6C3FC5]" aria-hidden /> : null}
          {label}
        </label>
        <span className="cursor-help text-[#9CA3AF]" title={tooltip}>
          <Info className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="range"
          min={0}
          max={steps}
          value={Math.round((safe - min) / step)}
          onChange={(e) => onChange(clamp(min + Number(e.target.value) * step))}
          className="h-2 flex-1 cursor-pointer accent-[#6C3FC5]"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={safe}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className={`w-full rounded-[10px] px-3 py-2.5 tabular-nums text-sm font-semibold outline-none sm:w-28 dark:bg-neutral-900 ${
            error
              ? "border-2 border-red-500"
              : dirty
                ? "border-2 border-[#6C3FC5]"
                : "border border-neutral-200 dark:border-neutral-600"
          }`}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-[#9CA3AF]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

const STREAK_GLOBAL_KEY = "aprov_flash_streak_global";
const STREAK_DECK_PREFIX = "aprov_flash_streak_deck:";

function readStreak(key: string): { count: number; lastYmd: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, lastYmd: "" };
    const p = JSON.parse(raw) as { count?: number; lastYmd?: string };
    return { count: Number(p.count) || 0, lastYmd: String(p.lastYmd || "") };
  } catch {
    return { count: 0, lastYmd: "" };
  }
}

function writeStreak(key: string, s: { count: number; lastYmd: string }) {
  localStorage.setItem(key, JSON.stringify(s));
}

function bumpStreakState(lastYmd: string, count: number, today: string): { count: number; lastYmd: string } {
  if (lastYmd === today) return { count, lastYmd: today };
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);
  if (lastYmd === yesterday) return { count: count + 1, lastYmd: today };
  return { count: 1, lastYmd: today };
}

function deckEmoji(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("portugu")) return "📖";
  if (n.includes("direito") || n.includes("lei")) return "⚖️";
  if (n.includes("mat") || n.includes("racioc")) return "🔢";
  if (n.includes("hist")) return "🏛️";
  if (n.includes("info") || n.includes("comput")) return "💻";
  if (n.includes("ingl")) return "🌍";
  return "📚";
}

function formatProximaRevisao(
  vencidos: number,
  proximaFuturaIso: string | null,
): string {
  if (vencidos > 0) return "Próxima revisão: hoje";
  if (!proximaFuturaIso) return "Sem cartões agendados";
  const d = new Date(proximaFuturaIso + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff <= 0) return "Próxima revisão: hoje";
  if (diff === 1) return "Próxima revisão: em 1 dia";
  return `Próxima revisão: em ${diff} dias`;
}

function metricForDeck(rows: DeckMetricRow[], deckId: string): DeckMetricRow {
  return (
    rows.find((r) => r.deck_id === deckId) ?? {
      deck_id: deckId,
      novos: 0,
      aprendendo: 0,
      vencidos: 0,
      dominio_pct: 0,
      proxima_futura: null,
    }
  );
}

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
  const [reviewSessionActive, setReviewSessionActive] = React.useState(false);
  const [sessionStartTs, setSessionStartTs] = React.useState<number | null>(null);
  const [sessionStats, setSessionStats] = React.useState({ correct: 0, wrong: 0 });

  /* config accordion */
  const [cfgSections, setCfgSections] = React.useState({ limits: true, algorithm: false, penalties: false });

  /* config state */
  const [configDraft, setConfigDraft] = React.useState<Partial<FlashcardConfig>>({});
  const [streakRev, setStreakRev] = React.useState(0);

  /* ── Queries ── */
  const { data: decks = [] } = useQuery({
    queryKey: ["flashcards-decks"],
    queryFn: async () => (await api.get("/flashcards/decks")).data as Deck[],
  });

  const { data: metrics } = useQuery({
    queryKey: ["flashcards-metrics"],
    queryFn: async () => (await api.get("/flashcards/metrics")).data as FlashcardsMetrics,
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
      ? Math.round(deckMetrics.reduce((a, d) => a + d.dominio_pct, 0) / deckMetrics.length)
      : 0;

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
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      toast.success("Baralho excluído.");
      setView("decks"); setSelectedDeck(null);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/flashcards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards-cards", selectedDeck?.id] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      toast.success("Cartão excluído.");
    },
  });

  const responderMutation = useMutation({
    mutationFn: async ({ cardId, label }: { cardId: string; label: string; deckId?: string }) =>
      api.post(`/flashcards/${cardId}/responder`, { label }),
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
      writeStreak(STREAK_GLOBAL_KEY, bumpStreakState(g.lastYmd, g.count, today));
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
  const configErrors = React.useMemo(() => {
    const e: Partial<Record<keyof FlashcardConfig, string>> = {};
    const n = configDraft.novos_por_dia ?? ANKI_DEFAULTS.novos_por_dia;
    const m = configDraft.max_revisoes_dia ?? ANKI_DEFAULTS.max_revisoes_dia;
    if (n < 1 || n > 9999) e.novos_por_dia = "Entre 1 e 9999";
    if (m < 1 || m > 9999) e.max_revisoes_dia = "Entre 1 e 9999";
    const id = configDraft.intervalo_dificil_mult ?? ANKI_DEFAULTS.intervalo_dificil_mult;
    const bf = configDraft.bonus_facil_mult ?? ANKI_DEFAULTS.bonus_facil_mult;
    if (id < 1 || id > 5) e.intervalo_dificil_mult = "Entre 1 e 5";
    if (bf < 1 || bf > 5) e.bonus_facil_mult = "Entre 1 e 5";
    const fi = configDraft.facilidade_inicial ?? ANKI_DEFAULTS.facilidade_inicial;
    const fm = configDraft.facilidade_minima ?? ANKI_DEFAULTS.facilidade_minima;
    if (fi < 1.3 || fi > 9.9) e.facilidade_inicial = "Entre 1,3 e 9,9";
    if (fm < 1 || fm > 5) e.facilidade_minima = "Entre 1 e 5";
    const pd = configDraft.penalidade_dificil ?? ANKI_DEFAULTS.penalidade_dificil;
    const pb = configDraft.bonus_facilidade_facil ?? ANKI_DEFAULTS.bonus_facilidade_facil;
    if (pd < 0 || pd > 1) e.penalidade_dificil = "Entre 0 e 1";
    if (pb < 0 || pb > 1) e.bonus_facilidade_facil = "Entre 0 e 1";
    return e;
  }, [configDraft]);

  const configDirtyFields = React.useMemo(() => {
    const keys: (keyof FlashcardConfig)[] = [
      "novos_por_dia", "max_revisoes_dia", "intervalo_dificil_mult", "bonus_facil_mult",
      "facilidade_inicial", "facilidade_minima", "penalidade_dificil", "bonus_facilidade_facil",
    ];
    const dirty: (keyof FlashcardConfig)[] = [];
    for (const k of keys) {
      const a = configDraft[k];
      const b = savedCfg[k];
      if (a === undefined) continue;
      if (typeof a === "number" && typeof b === "number" && Number.isFinite(a) && Number.isFinite(b)) {
        if (Math.abs(a - b) > 1e-6) dirty.push(k);
      }
    }
    return dirty;
  }, [configDraft, savedCfg]);

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
    novos_por_dia: 20, max_revisoes_dia: 100,
    intervalo_dificil_mult: 1.2, bonus_facil_mult: 1.3,
    facilidade_inicial: 2.5, facilidade_minima: 1.3,
    penalidade_dificil: 0.15, bonus_facilidade_facil: 0.15,
  };

  const reviewFocusMode = tab === "revisar" && reviewSessionActive;

  React.useEffect(() => {
    if (tab !== "revisar" || !reviewSessionActive || !currentCard) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return;
      if (e.key === " " || e.key === "Enter") {
        if (!flipped) {
          e.preventDefault();
          setFlipped(true);
        }
      }
      if (flipped && !responderMutation.isPending) {
        const map: Record<string, string> = { "1": "errei", "2": "dificil", "3": "bom", "4": "facil" };
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

  /* ── Tab bar ── */
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "baralhos", label: "Meus Baralhos", icon: <Library className="h-5 w-5 shrink-0" strokeWidth={2} /> },
    { id: "revisar", label: "Revisar Hoje", icon: <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2} /> },
    { id: "config", label: "Configurações", icon: <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2} /> },
  ];

  /* ──────────────────────────────────────────────────────────────────────── */
  /* RENDER                                                                   */
  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="-m-6 min-h-full bg-[#F5F4FA] p-6 dark:bg-neutral-900"
      style={{ fontFamily: "Inter, system-ui, sans-serif", color: FLASH_TEXT }}
    >
      <style>{`
        @keyframes fc-badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.5); transform: scale(1); }
          50% { box-shadow: 0 0 0 8px rgba(234, 88, 12, 0); transform: scale(1.05); }
        }
        .fc-badge-pulse { animation: fc-badge-pulse 2.2s ease-in-out infinite; }
        @keyframes fc-check-bounce {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.92; }
        }
        .fc-check-bounce { animation: fc-check-bounce 2s ease-in-out infinite; }
        .fc-deck-card {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .fc-deck-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .fc-review-btn {
          position: relative;
          overflow: hidden;
        }
        .fc-review-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.45) 10%, transparent 10.01%);
          transform: scale(12);
          opacity: 0;
          transition: transform 0.45s, opacity 0.45s;
          pointer-events: none;
        }
        .fc-review-btn:active::after {
          transform: scale(0);
          opacity: 1;
          transition: 0s;
        }
        @keyframes fc-session-check-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .fc-session-check-in { animation: fc-session-check-in 400ms ease forwards; }
      `}</style>

      <div
        className={
          reviewFocusMode
            ? "mx-auto w-full max-w-[780px] space-y-4 px-4 pb-6 pt-2"
            : "mx-auto max-w-6xl space-y-4 pb-6"
        }
      >
        {/* Header + stats */}
        {!reviewFocusMode ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-neutral-100">
              Flashcards
            </h1>
            <p className="mt-0.5 text-sm text-[#6B7280] dark:text-neutral-400">
              Revise com repetição espaçada e fixe o conteúdo dos editais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <Layers className="h-4 w-4 text-[#6C3FC5]" />
              <span className="text-[#6B7280] dark:text-neutral-400">Cartões</span>
              <span className="tabular-nums text-base font-semibold text-[#1A1A2E] dark:text-neutral-100">
                {totalCardsGlobal}
              </span>
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <span className="text-lg leading-none" aria-hidden>🔥</span>
              <span className="text-[#6B7280] dark:text-neutral-400">Sequência</span>
              <span className="tabular-nums text-base font-semibold text-[#1A1A2E] dark:text-neutral-100">
                {globalStreak} {globalStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm dark:border-orange-900/50 dark:bg-neutral-800"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <span className="text-[#6B7280] dark:text-neutral-400">Revisar hoje</span>
              <span
                className={[
                  "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full px-2 tabular-nums text-sm font-semibold text-white",
                  dueTodayTotal > 0 ? "fc-badge-pulse" : "",
                ].join(" ")}
                style={{ backgroundColor: dueTodayTotal > 0 ? FLASH_DUE_BADGE : FLASH_MUTED }}
              >
                {dueTodayTotal}
              </span>
            </div>
            {deckMetrics.length > 0 ? (
              <div
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-neutral-800"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                <span className="text-[#6B7280] dark:text-neutral-400">Domínio médio</span>
                <span className="tabular-nums text-base font-semibold text-[#22C55E]">{avgDominio}%</span>
              </div>
            ) : null}
          </div>
        </header>
        ) : null}

        {/* Tabs */}
        {!reviewFocusMode ? (
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-0 scrollbar-thin sm:mx-0">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTab(t.id); setView("decks"); }}
                  className={[
                    "group relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "text-[#6C3FC5]"
                      : "text-[#6B7280] hover:text-[#1A1A2E] dark:text-neutral-400 dark:hover:text-neutral-200",
                  ].join(" ")}
                >
                  {t.icon}
                  <span className="whitespace-nowrap">{t.label}</span>
                  {t.id === "revisar" ? (
                    <span
                      className={[
                        "inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-1.5 tabular-nums text-xs font-semibold text-white",
                        dueTodayTotal > 0 ? "fc-badge-pulse" : "",
                      ].join(" ")}
                      style={{ backgroundColor: dueTodayTotal > 0 ? FLASH_DUE_BADGE : "#9CA3AF" }}
                    >
                      {dueTodayTotal}
                    </span>
                  ) : null}
                  {active ? (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-1 rounded-t-full bg-[#6C3FC5]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        ) : null}

        {/* Contexto + ações (baralhos) */}
        {tab === "baralhos" && view === "decks" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-[#6B7280] dark:text-neutral-400">
              Agrupe cartões por matéria ou edital. Cada baralho usa o algoritmo Anki para priorizar o que você mais precisa rever.
            </p>
            <button
              type="button"
              onClick={() => setDeckModal({ open: true, deck: null })}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              style={{ backgroundColor: FLASH_PRIMARY }}
            >
              <Plus className="h-4 w-4" />
              Novo baralho
            </button>
          </div>
        ) : null}

      {/* ── TAB: Baralhos ── */}
      {tab === "baralhos" ? (
        view === "decks" ? (
          /* Deck grid */
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
                  onClick={() => setDeckModal({ open: true })}
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
                            onClick={() => setDeckModal({ open: true, deck })}
                            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir o baralho "${deck.nome}"? Todos os cartões serão removidos.`))
                                deleteDeckMutation.mutate(deck.id);
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
                          onClick={() => { setSelectedDeck(deck); setView("deck-detail"); }}
                          className="flex-1 rounded-xl border-2 border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] hover:bg-violet-50/80 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-[#6C3FC5]"
                        >
                          Ver cartões
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewDeckId(deck.id);
                            setTab("revisar");
                          }}
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
        ) : (
          /* Deck detail — interior do baralho */
          (() => {
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
                    onClick={() => { setView("decks"); setSelectedDeck(null); }}
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
                        onClick={() => setCardModal({ open: true, card: null })}
                        className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        style={{ backgroundColor: FLASH_PRIMARY }}
                      >
                        <Plus className="h-4 w-4" />
                        Novo cartão
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewDeckId(d.id);
                          setTab("revisar");
                        }}
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
                      onClick={() => setCardModal({ open: true })}
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
                                    onClick={() => setCardModal({ open: true, card })}
                                    className="rounded-lg p-2 text-[#6B7280] hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm("Excluir este cartão?"))
                                        deleteCardMutation.mutate(card.id);
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
          })()
        )
      ) : null}

      {/* ── TAB: Revisar ── */}
      {tab === "revisar" ? (
        <div className="relative space-y-4 pb-28">
          {reviewQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-[#6B7280]">Carregando pendências…</div>
          ) : dueCards.length === 0 ? (
            (() => {
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
                      onClick={() => { setTab("config"); setView("decks"); }}
                      className="rounded-[10px] border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#6C3FC5] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      Revisar no avançado
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab("baralhos"); setView("decks"); }}
                      className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                      style={{ backgroundColor: FLASH_PRIMARY }}
                    >
                      Ver meus baralhos
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => reviewQuery.refetch()}
                    className="inline-flex items-center gap-2 rounded-[10px] border-2 border-[#6C3FC5] bg-white px-5 py-2 text-sm font-semibold text-[#6C3FC5] transition hover:bg-violet-50 dark:bg-neutral-800 dark:hover:bg-violet-950/40"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Atualizar lista
                  </button>
                </div>
              );
            })()
          ) : reviewSessionActive && reviewIdx >= dueCards.length ? (
            (() => {
              const durMin = sessionStartTs != null ? Math.floor((Date.now() - sessionStartTs) / 60000) : 0;
              const durLabel = durMin < 1 ? "< 1 min" : `${durMin} min`;
              return (
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
                      onClick={() => {
                        setReviewSessionActive(false);
                        setReviewIdx(0);
                        setFlipped(false);
                        setReviewDone(0);
                        setSessionStartTs(null);
                        setSessionStats({ correct: 0, wrong: 0 });
                        setTab("baralhos");
                        setView("decks");
                        reviewQuery.refetch();
                      }}
                      className="rounded-[10px] border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors duration-200 ease-out hover:bg-[#F9FAFB]"
                    >
                      Ver meus baralhos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewIdx(0);
                        setFlipped(false);
                        setReviewDone(0);
                        setSessionStartTs(Date.now());
                        setSessionStats({ correct: 0, wrong: 0 });
                        reviewQuery.refetch();
                      }}
                      className="rounded-[10px] bg-[#6C3FC5] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-[#5B32A8]"
                    >
                      Revisar novamente
                    </button>
                  </div>
                </div>
              );
            })()
          ) : reviewSessionActive ? (
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
                  onClick={() => {
                    setReviewSessionActive(false);
                    setReviewIdx(0);
                    setFlipped(false);
                    setReviewDone(0);
                    setSessionStartTs(null);
                    setSessionStats({ correct: 0, wrong: 0 });
                    reviewQuery.refetch();
                  }}
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
                        onClick={() => setFlipped(true)}
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
                                  disabled={responderMutation.isPending}
                                  title={`${b.title} · tecla ${b.kbd}`}
                                  onClick={() =>
                                    responderMutation.mutate({
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
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-[#6B7280] dark:text-neutral-400">
                Escolha o baralho ou revise tudo de uma vez. Toque em um cartão para abrir só ele, ou inicie a sessão completa.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDeckId(null)}
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
                    onClick={() => setReviewDeckId(d.id)}
                    className={[
                      "max-w-[200px] truncate rounded-full px-4 py-2 text-sm font-semibold transition",
                      reviewDeckId === d.id
                        ? "bg-[#6C3FC5] text-white shadow-md"
                        : "border border-neutral-200 bg-white text-[#1A1A2E] hover:border-[#6C3FC5] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
                    ].join(" ")}
                    title={d.nome}
                  >
                    {d.nome}
                  </button>
                ))}
              </div>

              <ul className="space-y-3">
                {dueCards.map((c, i) => {
                  const u = urgencyForDueCard(c);
                  const deckNome = decks.find((x) => x.id === c.deck_id)?.nome ?? "Baralho";
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
                        onClick={() => {
                          setReviewIdx(i);
                          setReviewSessionActive(true);
                          setFlipped(false);
                          setReviewDone(0);
                          setSessionStartTs(Date.now());
                          setSessionStats({ correct: 0, wrong: 0 });
                        }}
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
                onClick={() => {
                  setReviewIdx(0);
                  setReviewSessionActive(true);
                  setFlipped(false);
                  setReviewDone(0);
                  setSessionStartTs(Date.now());
                  setSessionStats({ correct: 0, wrong: 0 });
                }}
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
          )}
        </div>
      ) : null}

      {/* ── TAB: Configurações ── */}
      {tab === "config" ? (
        <div className="space-y-4 pb-4">
          {!cfgData ? (
            <div className="py-16 text-center text-sm text-[#6B7280]">Carregando configurações…</div>
          ) : (
            <>
              <div className="rounded-[12px] border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800" style={{ boxShadow: FLASH_CARD_SHADOW }}>
                <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-neutral-100">Repetição espaçada</h2>
                <p className="mt-1 text-sm text-[#6B7280] dark:text-neutral-400">
                  Ajuste limites diários e o algoritmo estilo Anki. Valores inválidos aparecem em vermelho.
                </p>
              </div>

              <FlashCfgAccordion
                title="📊 Limites diários"
                open={cfgSections.limits}
                onToggle={() => setCfgSections((s) => ({ ...s, limits: !s.limits }))}
              >
                <FlashCfgIntRow
                  label="Novos cartões por dia"
                  tooltip="Teto de cartões novos introduzidos por dia. Afeta quantos você vê na fila."
                  value={configDraft.novos_por_dia ?? ANKI_DEFAULTS.novos_por_dia}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, novos_por_dia: v }))}
                  min={1}
                  max={100}
                  dirty={configDirtyFields.includes("novos_por_dia")}
                  error={configErrors.novos_por_dia}
                  defaultVal={ANKI_DEFAULTS.novos_por_dia}
                  onChipReset={() => setConfigDraft((d) => ({ ...d, novos_por_dia: ANKI_DEFAULTS.novos_por_dia }))}
                />
                <FlashCfgIntRow
                  label="Máximo de revisões por dia"
                  tooltip="Limite total de revisões (novos + pendentes) por dia. Evita sobrecarga. Use o número à direita para valores acima do fim do slider (até 9999)."
                  value={configDraft.max_revisoes_dia ?? ANKI_DEFAULTS.max_revisoes_dia}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, max_revisoes_dia: v }))}
                  min={1}
                  max={9999}
                  sliderMax={300}
                  dirty={configDirtyFields.includes("max_revisoes_dia")}
                  error={configErrors.max_revisoes_dia}
                  defaultVal={ANKI_DEFAULTS.max_revisoes_dia}
                  onChipReset={() => setConfigDraft((d) => ({ ...d, max_revisoes_dia: ANKI_DEFAULTS.max_revisoes_dia }))}
                />
              </FlashCfgAccordion>

              <FlashCfgAccordion
                title="⚙️ Algoritmo de intervalos"
                open={cfgSections.algorithm}
                onToggle={() => setCfgSections((s) => ({ ...s, algorithm: !s.algorithm }))}
              >
                <FlashCfgFloatRow
                  label="Multiplicador Difícil"
                  tooltip="Multiplica o intervalo atual ao marcar Difícil. Valores maiores = intervalos mais longos mesmo com dificuldade."
                  value={configDraft.intervalo_dificil_mult ?? ANKI_DEFAULTS.intervalo_dificil_mult}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, intervalo_dificil_mult: v }))}
                  min={1}
                  max={5}
                  step={0.05}
                  decimals={2}
                  dirty={configDirtyFields.includes("intervalo_dificil_mult")}
                  error={configErrors.intervalo_dificil_mult}
                />
                <FlashCfgFloatRow
                  label="Bônus Fácil"
                  tooltip="Fator extra no intervalo ao marcar Fácil. Aumenta o espaçamento de cartões que você domina."
                  value={configDraft.bonus_facil_mult ?? ANKI_DEFAULTS.bonus_facil_mult}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, bonus_facil_mult: v }))}
                  min={1}
                  max={5}
                  step={0.05}
                  decimals={2}
                  dirty={configDirtyFields.includes("bonus_facil_mult")}
                  error={configErrors.bonus_facil_mult}
                />
                <FlashCfgFloatRow
                  label="Facilidade inicial (EF)"
                  tooltip="Fator de facilidade inicial dos cartões novos. Anki usa 2,5."
                  value={configDraft.facilidade_inicial ?? ANKI_DEFAULTS.facilidade_inicial}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, facilidade_inicial: v }))}
                  min={1.3}
                  max={9.9}
                  step={0.1}
                  decimals={1}
                  dirty={configDirtyFields.includes("facilidade_inicial")}
                  error={configErrors.facilidade_inicial}
                />
                <FlashCfgFloatRow
                  label="Facilidade mínima"
                  tooltip="Piso do EF: evita que intervalos fiquem ridiculamente curtos após muitas dificuldades."
                  value={configDraft.facilidade_minima ?? ANKI_DEFAULTS.facilidade_minima}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, facilidade_minima: v }))}
                  min={1}
                  max={5}
                  step={0.1}
                  decimals={1}
                  dirty={configDirtyFields.includes("facilidade_minima")}
                  error={configErrors.facilidade_minima}
                />
              </FlashCfgAccordion>

              <FlashCfgAccordion
                title="🎯 Penalidades e bônus"
                open={cfgSections.penalties}
                onToggle={() => setCfgSections((s) => ({ ...s, penalties: !s.penalties }))}
              >
                <FlashCfgFloatRow
                  label="Penalidade Difícil (EF)"
                  tooltip="Quanto o fator de facilidade cai ao marcar Difícil."
                  value={configDraft.penalidade_dificil ?? ANKI_DEFAULTS.penalidade_dificil}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, penalidade_dificil: v }))}
                  min={0}
                  max={1}
                  step={0.01}
                  decimals={2}
                  dirty={configDirtyFields.includes("penalidade_dificil")}
                  error={configErrors.penalidade_dificil}
                />
                <FlashCfgFloatRow
                  label="Bônus Fácil (EF)"
                  tooltip="Quanto o EF sobe ao marcar Fácil, recompensando cartões fáceis."
                  value={configDraft.bonus_facilidade_facil ?? ANKI_DEFAULTS.bonus_facilidade_facil}
                  onChange={(v) => setConfigDraft((d) => ({ ...d, bonus_facilidade_facil: v }))}
                  min={0}
                  max={1}
                  step={0.01}
                  decimals={2}
                  dirty={configDirtyFields.includes("bonus_facilidade_facil")}
                  error={configErrors.bonus_facilidade_facil}
                />
              </FlashCfgAccordion>

              <div
                className="sticky bottom-0 z-30 mt-6 flex flex-col gap-3 rounded-t-[12px] border border-neutral-200 bg-[#FFFFFF] px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:border-neutral-700 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  {configDirtyCount > 0 ? (
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      ⚠️ {configDirtyCount} alteraç{configDirtyCount === 1 ? "ão" : "ões"} não salva{configDirtyCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="text-[#6B7280] dark:text-neutral-400">Nenhuma alteração pendente.</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigDraft({ ...ANKI_DEFAULTS })}
                    className="rounded-[10px] border-2 border-neutral-200 px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Restaurar padrões
                  </button>
                  <button
                    type="button"
                    disabled={saveConfigMutation.isPending || Object.keys(configErrors).length > 0}
                    onClick={() => {
                      if (Object.keys(configErrors).length > 0) {
                        toast.error("Corrija os campos em vermelho antes de salvar.");
                        return;
                      }
                      saveConfigMutation.mutate();
                    }}
                    className="rounded-[10px] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: FLASH_PRIMARY }}
                  >
                    {saveConfigMutation.isPending ? "Salvando…" : "Salvar configurações"}
                  </button>
                </div>
              </div>

              <div
                className="rounded-[12px] border border-neutral-100 bg-violet-50/50 p-4 text-xs text-[#6B7280] dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-neutral-400"
              >
                <p className="font-semibold text-[#1A1A2E] dark:text-neutral-200">Lembretes rápidos</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li><span className="font-medium text-red-600">Errei</span> — reinicia o cartão.</li>
                  <li><span className="font-medium text-orange-600">Difícil</span> — intervalo × mult. difícil.</li>
                  <li><span className="font-medium text-blue-600">Bom</span> — SM-2 padrão.</li>
                  <li><span className="font-medium text-emerald-600">Fácil</span> — intervalo com bônus.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      ) : null}

      </div>

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
        deckName={selectedDeck?.nome}
        card={cardModal.card}
        decks={decks.map((d) => ({ id: d.id, nome: d.nome }))}
        onDeckChange={(id) => {
          const d = decks.find((x) => x.id === id);
          if (d) setSelectedDeck(d);
        }}
      />
    </div>
  );
}

