export type Deck = {
  id: string;
  nome: string;
  parent_id: string | null;
  disciplina_id: string | null;
  plano_id?: string | null;
  descricao: string | null;
  cor_hex: string | null;
  total_cards: number;
  full_path?: string;
  children?: Deck[];
  created_at: string;
};

export type Flashcard = {
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
  proxima_revisao: string;
  ultima_revisao: string | null;
  created_at: string;
};

export type FlashcardConfig = {
  novos_por_dia: number;
  max_revisoes_dia: number;
  intervalo_dificil_mult: number;
  bonus_facil_mult: number;
  facilidade_inicial: number;
  facilidade_minima: number;
  penalidade_dificil: number;
  bonus_facilidade_facil: number;
};

export type DeckMetricRow = {
  deck_id: string;
  novos: number;
  aprendendo: number;
  vencidos: number;
  dominio_pct: number;
  proxima_futura: string | null;
};

export type FlashcardsMetrics = {
  total_cards: number;
  due_today_total: number;
  decks: DeckMetricRow[];
};

export type FlashcardsTab = "baralhos" | "revisar" | "config";
export type FlashcardsView = "decks" | "deck-detail";
