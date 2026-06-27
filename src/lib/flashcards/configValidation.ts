import type { FlashcardConfig } from "./types";
import { ANKI_DEFAULTS } from "./constants";

export function validateFlashcardConfig(
  draft: Partial<FlashcardConfig>,
): Partial<Record<keyof FlashcardConfig, string>> {
  const e: Partial<Record<keyof FlashcardConfig, string>> = {};
  const n = draft.novos_por_dia ?? ANKI_DEFAULTS.novos_por_dia;
  const m = draft.max_revisoes_dia ?? ANKI_DEFAULTS.max_revisoes_dia;
  if (n < 1 || n > 9999) e.novos_por_dia = "Entre 1 e 9999";
  if (m < 1 || m > 9999) e.max_revisoes_dia = "Entre 1 e 9999";
  const id = draft.intervalo_dificil_mult ?? ANKI_DEFAULTS.intervalo_dificil_mult;
  const bf = draft.bonus_facil_mult ?? ANKI_DEFAULTS.bonus_facil_mult;
  if (id < 1 || id > 5) e.intervalo_dificil_mult = "Entre 1 e 5";
  if (bf < 1 || bf > 5) e.bonus_facil_mult = "Entre 1 e 5";
  const fi = draft.facilidade_inicial ?? ANKI_DEFAULTS.facilidade_inicial;
  const fm = draft.facilidade_minima ?? ANKI_DEFAULTS.facilidade_minima;
  if (fi < 1.3 || fi > 9.9) e.facilidade_inicial = "Entre 1,3 e 9,9";
  if (fm < 1 || fm > 5) e.facilidade_minima = "Entre 1 e 5";
  const pd = draft.penalidade_dificil ?? ANKI_DEFAULTS.penalidade_dificil;
  const pb = draft.bonus_facilidade_facil ?? ANKI_DEFAULTS.bonus_facilidade_facil;
  if (pd < 0 || pd > 1) e.penalidade_dificil = "Entre 0 e 1";
  if (pb < 0 || pb > 1) e.bonus_facilidade_facil = "Entre 0 e 1";
  return e;
}

export function dirtyFlashcardConfigFields(
  draft: Partial<FlashcardConfig>,
  saved: FlashcardConfig,
): (keyof FlashcardConfig)[] {
  const keys: (keyof FlashcardConfig)[] = [
    "novos_por_dia",
    "max_revisoes_dia",
    "intervalo_dificil_mult",
    "bonus_facil_mult",
    "facilidade_inicial",
    "facilidade_minima",
    "penalidade_dificil",
    "bonus_facilidade_facil",
  ];
  const dirty: (keyof FlashcardConfig)[] = [];
  for (const k of keys) {
    const a = draft[k];
    const b = saved[k];
    if (a === undefined) continue;
    if (typeof a === "number" && typeof b === "number" && Number.isFinite(a) && Number.isFinite(b)) {
      if (Math.abs(a - b) > 1e-6) dirty.push(k);
    }
  }
  return dirty;
}
