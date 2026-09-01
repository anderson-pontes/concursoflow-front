import type { ConfigPlanejamento, DisciplinaPlanoInput, TipoPlanoGuiado } from "@/types/planejamento";

export const ONBOARDING_DRAFT_SCHEMA_VERSION = 1;
export const ONBOARDING_DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

const STORAGE_PREFIX = "clickedital:onboarding-draft";

export type OnboardingDraft = {
  schemaVersion: typeof ONBOARDING_DRAFT_SCHEMA_VERSION;
  userScope: string;
  updatedAt: string;
  idempotencyKey: string;
  step: number;
  tipo: TipoPlanoGuiado | null;
  busca: string;
  editalId: string | null;
  versionId: string | null;
  cargoId: string | null;
  nome: string;
  orgao: string;
  cargoNome: string;
  banca: string;
  dataProva: string;
  observacoes: string;
  disciplinas: DisciplinaPlanoInput[];
  config: ConfigPlanejamento;
};

export type DraftReadResult =
  | { status: "empty" }
  | { status: "available"; draft: OnboardingDraft }
  | { status: "discarded"; reason: "invalid" | "expired" | "wrong_user" };

function normalizedScope(userScope: string): string {
  return userScope.trim();
}

export function onboardingDraftKey(userScope: string): string {
  return `${STORAGE_PREFIX}:v${ONBOARDING_DRAFT_SCHEMA_VERSION}:${encodeURIComponent(normalizedScope(userScope))}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || isNullableString(value);
}

function isDisciplina(value: unknown): value is DisciplinaPlanoInput {
  if (!isRecord(value)) return false;
  return isOptionalNullableString(value.disciplina_id)
    && typeof value.nome === "string"
    && Array.isArray(value.topicos)
    && value.topicos.every((item) => typeof item === "string")
    && typeof value.ativa === "boolean"
    && typeof value.peso === "number"
    && ["muito_fraco", "fraco", "regular", "bom", "muito_bom"].includes(String(value.conhecimento))
    && Number.isInteger(value.ordem);
}

function isConfig(value: unknown): value is ConfigPlanejamento {
  if (!isRecord(value) || !isRecord(value.disponibilidade_minutos)) return false;
  return (value.tipo === "ciclo" || value.tipo === "semanal")
    && Object.values(value.disponibilidade_minutos).every((minutes) => typeof minutes === "number" && minutes >= 0)
    && typeof value.sessao_min_minutos === "number"
    && typeof value.sessao_max_minutos === "number"
    && typeof value.data_inicio === "string"
    && typeof value.data_fim === "string";
}

function isDraft(value: unknown): value is OnboardingDraft {
  if (!isRecord(value) || value.schemaVersion !== ONBOARDING_DRAFT_SCHEMA_VERSION) return false;
  if (typeof value.userScope !== "string" || typeof value.updatedAt !== "string") return false;
  if (typeof value.idempotencyKey !== "string" || value.idempotencyKey.length < 8) return false;
  if (!Number.isInteger(value.step) || Number(value.step) < 1 || Number(value.step) > 5) return false;
  if (value.tipo !== null && value.tipo !== "catalogo" && value.tipo !== "personalizado") return false;
  if (!isNullableString(value.editalId) || !isNullableString(value.versionId) || !isNullableString(value.cargoId)) return false;
  if (!Array.isArray(value.disciplinas) || !value.disciplinas.every(isDisciplina) || !isConfig(value.config)) return false;
  return [
    value.busca,
    value.nome,
    value.orgao,
    value.cargoNome,
    value.banca,
    value.dataProva,
    value.observacoes,
  ].every((item) => typeof item === "string");
}

export function readOnboardingDraft(userScope: string, storage: Storage = localStorage): DraftReadResult {
  const scope = normalizedScope(userScope);
  if (!scope) return { status: "empty" };
  const key = onboardingDraftKey(scope);
  const raw = storage.getItem(key);
  if (!raw) return { status: "empty" };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDraft(parsed)) {
      storage.removeItem(key);
      return { status: "discarded", reason: "invalid" };
    }
    if (parsed.userScope !== scope) {
      storage.removeItem(key);
      return { status: "discarded", reason: "wrong_user" };
    }
    const updatedAt = Date.parse(parsed.updatedAt);
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > ONBOARDING_DRAFT_MAX_AGE_MS) {
      storage.removeItem(key);
      return { status: "discarded", reason: "expired" };
    }
    return { status: "available", draft: parsed };
  } catch {
    storage.removeItem(key);
    return { status: "discarded", reason: "invalid" };
  }
}

export function saveOnboardingDraft(
  userScope: string,
  draft: Omit<OnboardingDraft, "schemaVersion" | "userScope" | "updatedAt">,
  storage: Storage = localStorage,
): OnboardingDraft | null {
  const scope = normalizedScope(userScope);
  if (!scope) return null;
  const value: OnboardingDraft = {
    ...draft,
    schemaVersion: ONBOARDING_DRAFT_SCHEMA_VERSION,
    userScope: scope,
    updatedAt: new Date().toISOString(),
  };
  try {
    storage.setItem(onboardingDraftKey(scope), JSON.stringify(value));
    return value;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(userScope: string, storage: Storage = localStorage): void {
  const scope = normalizedScope(userScope);
  if (!scope) return;
  try {
    storage.removeItem(onboardingDraftKey(scope));
  } catch {
    // O onboarding continua funcional quando o armazenamento do navegador está indisponível.
  }
}
