import type { FlashcardConfig } from "./types";

export const FLASH_PRIMARY = "#6C3FC5";
export const FLASH_PAGE_BG = "#F5F4FA";
export const FLASH_TEXT = "#1A1A2E";
export const FLASH_MUTED = "#6B7280";
export const FLASH_SUCCESS = "#22C55E";
export const FLASH_DUE_BADGE = "#EA580C";
export const FLASH_CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.07)";

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
