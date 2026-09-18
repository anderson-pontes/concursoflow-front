import axios from "axios";

import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const SCHEMA_VERSION = "1.0.0";
const DELIVERY_TIMEOUT_MS = 1_500;
const MAX_DELIVERY_ATTEMPTS = 2;
const DUPLICATE_WINDOW_MS = 1_000;

type TelemetryProperties = {
  catalog_search_started: { has_filters: boolean; filter_count: number; result_count: number };
  contest_context_changed: {
    source: "sidebar" | "catalog" | "settings";
    previous_state: "none" | "active";
    next_state: "none" | "active";
  };
  context_state_viewed: {
    state: "loading" | "no_contest" | "ready" | "empty" | "recoverable_error";
    surface: "dashboard" | "schedule" | "calendar" | "subjects";
  };
  catalog_item_opened: { source: "search_results" | "featured" | "direct" };
  activation_started: {
    activation_mode: "catalog" | "manual";
    entry_state: "no_contest" | "has_contest";
  };
  activation_step_completed: {
    step: "contest" | "details" | "subjects" | "topics" | "planning";
    step_position: number;
    total_steps: number;
  };
  activation_resumed: {
    step: "contest" | "details" | "subjects" | "topics" | "planning";
    step_position: number;
  };
  activation_completed: {
    activation_mode: "catalog" | "manual";
    subject_count: number;
    topic_count: number;
  };
  activation_failed: {
    stage: "contest" | "details" | "subjects" | "topics" | "planning" | "confirmation";
    error_code: TelemetryErrorCode;
  };
  plan_preview_generated: {
    planning_type: "cycle" | "weekly";
    block_count: number;
    total_minutes: number;
  };
  plan_confirmed: {
    planning_type: "cycle" | "weekly";
    block_count: number;
    total_minutes: number;
  };
  plan_confirmation_failed: { error_code: TelemetryErrorCode };
  next_action_viewed: { state: "ready" | "no_plan" | "empty_plan" | "completed" | "overdue" | "upcoming_exam" };
  next_action_started: { action_type: "study" | "review" | "questions" | "manual"; source: "dashboard" | "calendar" | "schedule" };
  manual_study_opened: { source: "dashboard" | "history" | "schedule" | "quick_action" };
};

export type TelemetryErrorCode = "validation" | "conflict" | "unavailable" | "server_error";
export type TelemetryEventName = keyof TelemetryProperties;
export type TelemetryJourneyEventName = Exclude<
  TelemetryEventName,
  | "catalog_search_started"
  | "contest_context_changed"
  | "context_state_viewed"
  | "next_action_viewed"
  | "next_action_started"
  | "manual_study_opened"
>;
export type TelemetryStandaloneEventName = Exclude<TelemetryEventName, TelemetryJourneyEventName>;

type TelemetryEnvelope = {
  event_id: string;
  event_name: TelemetryEventName;
  schema_version: typeof SCHEMA_VERSION;
  journey_id?: string;
  event_sequence?: number;
  properties: TelemetryProperties[TelemetryEventName];
};

type PreferenceResponse = { opted_out: boolean };

let optedOut: boolean | null = null;
let preferenceToken: string | null = null;
let preferenceRequest: Promise<boolean | null> | null = null;
const recentlyTracked = new Map<string, number>();

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function currentToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function syncPreferenceIdentity(token: string | null) {
  if (token === preferenceToken) return;
  preferenceToken = token;
  optedOut = null;
  preferenceRequest = null;
  recentlyTracked.clear();
}

async function loadPreferenceSilently(token: string): Promise<boolean | null> {
  syncPreferenceIdentity(token);
  if (optedOut !== null) return optedOut;
  if (preferenceRequest) return preferenceRequest;

  preferenceRequest = axios
    .get<PreferenceResponse>("/api/v1/telemetry/preference", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DELIVERY_TIMEOUT_MS,
    })
    .then(({ data }) => {
      optedOut = data.opted_out;
      return optedOut;
    })
    .catch(() => null)
    .finally(() => {
      preferenceRequest = null;
    });
  return preferenceRequest;
}

function duplicateFingerprint(envelope: TelemetryEnvelope): string {
  return `${envelope.event_name}:${JSON.stringify(envelope.properties)}`;
}

function isImmediateDuplicate(envelope: TelemetryEnvelope): boolean {
  const now = Date.now();
  const fingerprint = duplicateFingerprint(envelope);
  const previous = recentlyTracked.get(fingerprint);
  recentlyTracked.set(fingerprint, now);
  for (const [key, trackedAt] of recentlyTracked) {
    if (now - trackedAt > DUPLICATE_WINDOW_MS) recentlyTracked.delete(key);
  }
  return previous !== undefined && now - previous <= DUPLICATE_WINDOW_MS;
}

function waitForRetry(attempt: number) {
  const delay = 100 * attempt + Math.floor(Math.random() * 100);
  return new Promise<void>((resolve) => setTimeout(resolve, delay));
}

async function deliverSilently(envelope: TelemetryEnvelope): Promise<void> {
  const token = currentToken();
  if (!token) return;
  const preference = await loadPreferenceSilently(token);
  if (preference !== false || token !== currentToken()) return;

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    try {
      await axios.post(
        "/api/v1/telemetry/events",
        { events: [envelope] },
        { headers: { Authorization: `Bearer ${token}` }, timeout: DELIVERY_TIMEOUT_MS },
      );
      return;
    } catch {
      if (attempt === MAX_DELIVERY_ATTEMPTS) return;
      await waitForRetry(attempt);
    }
  }
}

function emit(envelope: TelemetryEnvelope) {
  if (isImmediateDuplicate(envelope)) return;
  void deliverSilently(envelope);
}

export function trackTelemetry<Name extends TelemetryStandaloneEventName>(
  eventName: Name,
  properties: TelemetryProperties[Name],
) {
  emit({
    event_id: uuid(),
    event_name: eventName,
    schema_version: SCHEMA_VERSION,
    properties,
  } as TelemetryEnvelope);
}

export type TelemetryJourney = {
  readonly id: string;
  track<Name extends TelemetryJourneyEventName>(eventName: Name, properties: TelemetryProperties[Name]): void;
};

type CatalogActivationOptions = {
  activationStarted: boolean;
  entryState: "no_contest" | "has_contest";
  source?: "search_results" | "featured" | "direct";
};

/** Emite a abertura elegível antes do início da ativação na mesma jornada. */
export function trackCatalogItemForActivation(
  journey: TelemetryJourney,
  { activationStarted, entryState, source = "search_results" }: CatalogActivationOptions,
): boolean {
  journey.track("catalog_item_opened", { source });
  if (activationStarted) return false;
  journey.track("activation_started", { activation_mode: "catalog", entry_state: entryState });
  return true;
}

export function createTelemetryJourney(): TelemetryJourney {
  const id = uuid();
  let sequence = 0;
  return {
    id,
    track(eventName, properties) {
      sequence += 1;
      emit({
        event_id: uuid(),
        event_name: eventName,
        schema_version: SCHEMA_VERSION,
        journey_id: id,
        event_sequence: sequence,
        properties,
      } as TelemetryEnvelope);
    },
  };
}

export function telemetryErrorCode(error: unknown): TelemetryErrorCode {
  if (!axios.isAxiosError(error)) return "server_error";
  const status = error.response?.status;
  if (status === 400 || status === 422) return "validation";
  if (status === 409) return "conflict";
  if (!status || status === 502 || status === 503 || status === 504) return "unavailable";
  return "server_error";
}

export async function getTelemetryPreference(): Promise<PreferenceResponse> {
  const { data } = await api.get<PreferenceResponse>("/telemetry/preference");
  const token = currentToken();
  preferenceToken = token;
  optedOut = data.opted_out;
  return data;
}

export async function updateTelemetryPreference(nextOptedOut: boolean): Promise<PreferenceResponse> {
  const { data } = await api.patch<PreferenceResponse>("/telemetry/preference", {
    opted_out: nextOptedOut,
  });
  preferenceToken = currentToken();
  optedOut = data.opted_out;
  if (data.opted_out) recentlyTracked.clear();
  return data;
}

export function resetTelemetryForTests() {
  optedOut = null;
  preferenceToken = null;
  preferenceRequest = null;
  recentlyTracked.clear();
}
