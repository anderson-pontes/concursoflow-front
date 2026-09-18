import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTelemetryJourney,
  resetTelemetryForTests,
  trackCatalogItemForActivation,
  trackTelemetry,
  type TelemetryJourney,
} from "@/services/telemetry";
import { useAuthStore } from "@/stores/authStore";

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const mockedAxios = vi.mocked(axios);

describe("telemetry port", () => {
  beforeEach(() => {
    resetTelemetryForTests();
    useAuthStore.setState({ accessToken: "test-token" });
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.setState({ accessToken: null });
  });

  it("descarta silenciosamente quando a preferência não pode ser confirmada", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("offline"));

    expect(() => trackTelemetry("catalog_search_started", { has_filters: true, filter_count: 2, result_count: 3 })).not.toThrow();

    await vi.waitFor(() => expect(mockedAxios.get).toHaveBeenCalledOnce());
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("respeita opt-out antes de enviar eventos", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { opted_out: true } });

    trackTelemetry("context_state_viewed", { state: "ready", surface: "dashboard" });

    await vi.waitFor(() => expect(mockedAxios.get).toHaveBeenCalledOnce());
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("envia somente o envelope aprovado sem identificadores de negócio", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { opted_out: false } });
    mockedAxios.post.mockResolvedValueOnce({ data: { enabled: false } });
    const journey = createTelemetryJourney();

    journey.track("activation_started", { activation_mode: "catalog", entry_state: "no_contest" });

    await vi.waitFor(() => expect(mockedAxios.post).toHaveBeenCalledOnce());
    const payload = mockedAxios.post.mock.calls[0][1] as { events: Array<Record<string, unknown>> };
    expect(payload.events[0]).toMatchObject({
      event_name: "activation_started",
      schema_version: "1.0.0",
      journey_id: journey.id,
      event_sequence: 1,
      properties: { activation_mode: "catalog", entry_state: "no_contest" },
    });
    expect(JSON.stringify(payload)).not.toMatch(/user_id|contest_id|edital_id|search_term|email/i);
  });

  it("envia o estado da próxima ação sem IDs ou texto livre", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { opted_out: false } });
    mockedAxios.post.mockResolvedValueOnce({ data: { enabled: false } });

    trackTelemetry("next_action_viewed", { state: "upcoming_exam" });

    await vi.waitFor(() => expect(mockedAxios.post).toHaveBeenCalledOnce());
    const payload = mockedAxios.post.mock.calls[0][1] as { events: Array<Record<string, unknown>> };
    expect(payload.events[0]).toMatchObject({
      event_name: "next_action_viewed",
      properties: { state: "upcoming_exam" },
    });
    expect(payload.events[0]).not.toHaveProperty("journey_id");
    expect(Object.keys(payload.events[0] as Record<string, unknown>)).not.toEqual(
      expect.arrayContaining(["contest_id", "topic_id", "discipline_id", "free_text"]),
    );
    expect(payload.events[0].properties).toEqual({ state: "upcoming_exam" });
  });

  it("ordena abertura do catálogo antes do início da ativação na mesma jornada", () => {
    const track = vi.fn();
    const journey = { id: "journey-test", track } as unknown as TelemetryJourney;

    const started = trackCatalogItemForActivation(journey, {
      activationStarted: false,
      entryState: "no_contest",
    });

    expect(started).toBe(true);
    expect(track.mock.calls.map(([eventName]) => eventName)).toEqual([
      "catalog_item_opened",
      "activation_started",
    ]);
  });

  it("não duplica o início da ativação ao abrir outro item do catálogo", () => {
    const track = vi.fn();
    const journey = { id: "journey-test", track } as unknown as TelemetryJourney;

    const started = trackCatalogItemForActivation(journey, {
      activationStarted: true,
      entryState: "has_contest",
    });

    expect(started).toBe(false);
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith("catalog_item_opened", { source: "search_results" });
  });

  it("reutiliza o mesmo event_id no retry e encerra sem propagar falha", async () => {
    vi.useFakeTimers();
    mockedAxios.get.mockResolvedValueOnce({ data: { opted_out: false } });
    mockedAxios.post.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { enabled: false } });

    trackTelemetry("contest_context_changed", {
      source: "sidebar",
      previous_state: "active",
      next_state: "active",
    });
    await vi.advanceTimersByTimeAsync(500);

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    const first = mockedAxios.post.mock.calls[0][1] as { events: Array<{ event_id: string }> };
    const retry = mockedAxios.post.mock.calls[1][1] as { events: Array<{ event_id: string }> };
    expect(retry.events[0].event_id).toBe(first.events[0].event_id);
  });
});
