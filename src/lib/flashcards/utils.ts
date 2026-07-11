import type { DeckMetricRow, Flashcard, FlashcardConfig } from "./types";

export function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export function cardStudyStatus(
  card: Flashcard,
): "novo" | "aprendendo" | "dominado" | "vencido" {
  const today = todayYmd();
  const pr = card.proxima_revisao.slice(0, 10);
  if (pr < today) return "vencido";
  if (card.repeticoes === 0) return "novo";
  if (card.repeticoes >= 2 && card.intervalo >= 7) return "dominado";
  return "aprendendo";
}

export function statusChipConfig(status: ReturnType<typeof cardStudyStatus>): {
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

export function formatProxBr(iso: string) {
  const [, m, d] = iso.slice(0, 10).split("-");
  if (!d || !m) return iso;
  return `${d}/${m}`;
}

export function urgencyForDueCard(card: Flashcard): { text: string; className: string } {
  const today = todayYmd();
  const pr = card.proxima_revisao.slice(0, 10);
  if (pr < today) {
    const days = Math.max(
      1,
      Math.round(
        (new Date(`${today}T12:00:00`).getTime() - new Date(`${pr}T12:00:00`).getTime()) /
          86400000,
      ),
    );
    return {
      text: `⚠️ Vencido há ${days} ${days === 1 ? "dia" : "dias"}`,
      className: "text-red-600 dark:text-red-400",
    };
  }
  if (card.repeticoes === 0) return { text: "🆕 Novo cartão", className: "text-blue-600 dark:text-blue-400" };
  return { text: "📅 Para hoje", className: "text-primary" };
}

export function earliestFutureReview(deckRows: DeckMetricRow[]): string | null {
  const dates = deckRows.map((r) => r.proxima_futura).filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return dates.sort()[0];
}

export function readStreak(key: string): { count: number; lastYmd: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, lastYmd: "" };
    const p = JSON.parse(raw) as { count?: number; lastYmd?: string };
    return { count: Number(p.count) || 0, lastYmd: String(p.lastYmd || "") };
  } catch {
    return { count: 0, lastYmd: "" };
  }
}

export function writeStreak(key: string, s: { count: number; lastYmd: string }) {
  localStorage.setItem(key, JSON.stringify(s));
}

export function bumpStreakState(
  lastYmd: string,
  count: number,
  today: string,
): { count: number; lastYmd: string } {
  if (lastYmd === today) return { count, lastYmd: today };
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);
  if (lastYmd === yesterday) return { count: count + 1, lastYmd: today };
  return { count: 1, lastYmd: today };
}

export function deckEmoji(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("portugu")) return "📖";
  if (n.includes("direito") || n.includes("lei")) return "⚖️";
  if (n.includes("mat") || n.includes("racioc")) return "🔢";
  if (n.includes("hist")) return "🏛️";
  if (n.includes("info") || n.includes("comput")) return "💻";
  if (n.includes("ingl")) return "🌍";
  return "📚";
}

export function formatProximaRevisao(vencidos: number, proximaFuturaIso: string | null): string {
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

export function metricForDeck(rows: DeckMetricRow[], deckId: string): DeckMetricRow {
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

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

export function previewIntervalos(card: Flashcard, cfg: FlashcardConfig) {
  const { intervalo, facilidade, repeticoes } = card;
  const f = Number(facilidade);
  const errei = 1;
  const dificil = repeticoes === 0 ? 1 : Math.max(2, Math.round(intervalo * cfg.intervalo_dificil_mult));
  const bom = repeticoes === 0 ? 1 : repeticoes === 1 ? 6 : Math.max(2, Math.round(intervalo * f));
  const facil = repeticoes <= 1 ? 4 : Math.max(4, Math.round(intervalo * f * cfg.bonus_facil_mult));
  return { errei, dificil, bom, facil };
}

export function fmtDias(d: number) {
  if (d === 0) return "agora";
  if (d === 1) return "1 dia";
  if (d < 30) return `${d} dias`;
  if (d < 365) return `${Math.round(d / 30)} meses`;
  return `${Math.round(d / 365)} anos`;
}
