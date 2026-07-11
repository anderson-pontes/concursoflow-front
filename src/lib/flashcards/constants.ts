import type { FlashcardConfig } from "./types";

/** @deprecated Use Tailwind `shadow-md` or `var(--shadow-md)` */
export const FLASH_CARD_SHADOW = "var(--shadow-md)";

export const ANKI_DEFAULTS: FlashcardConfig = {
  novos_por_dia: 20,
  max_revisoes_dia: 100,
  intervalo_dificil_mult: 1.2,
  bonus_facil_mult: 1.3,
  facilidade_inicial: 2.5,
  facilidade_minima: 1.3,
  penalidade_dificil: 0.15,
  bonus_facilidade_facil: 0.15,
};

export const STREAK_GLOBAL_KEY = "aprov_flash_streak_global";
export const STREAK_DECK_PREFIX = "aprov_flash_streak_deck:";
