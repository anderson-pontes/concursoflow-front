import { beforeEach, describe, expect, it } from "vitest";

import {
  clearOnboardingDraft,
  onboardingDraftKey,
  readOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/onboardingDraftStorage";

const baseDraft = {
  idempotencyKey: "idempotency-123",
  step: 3,
  tipo: "catalogo" as const,
  busca: "receita",
  editalId: "edital-1",
  versionId: "versao-1",
  cargoId: "cargo-1",
  nome: "Receita Federal",
  orgao: "RFB",
  cargoNome: "Auditor",
  banca: "FGV",
  dataProva: "2026-12-01",
  observacoes: "",
  disciplinas: [],
  config: {
    tipo: "ciclo" as const,
    disponibilidade_minutos: { 0: 60 },
    sessao_min_minutos: 25,
    sessao_max_minutos: 50,
    data_inicio: "2026-09-01",
    data_fim: "2026-12-01",
  },
};

describe("onboardingDraftStorage", () => {
  beforeEach(() => localStorage.clear());

  it("persiste e recupera um rascunho no escopo do usuário", () => {
    saveOnboardingDraft("user-1", baseDraft);

    const result = readOnboardingDraft("user-1");

    expect(result.status).toBe("available");
    if (result.status === "available") {
      expect(result.draft.step).toBe(3);
      expect(result.draft.versionId).toBe("versao-1");
      expect(result.draft.idempotencyKey).toBe("idempotency-123");
    }
    expect(readOnboardingDraft("user-2")).toEqual({ status: "empty" });
  });

  it("descarta conteúdo inválido sem interromper a jornada", () => {
    localStorage.setItem(onboardingDraftKey("user-1"), "{invalido");

    expect(readOnboardingDraft("user-1")).toEqual({ status: "discarded", reason: "invalid" });
    expect(localStorage.getItem(onboardingDraftKey("user-1"))).toBeNull();
  });

  it("descarta um envelope gravado para outro usuário", () => {
    saveOnboardingDraft("user-1", baseDraft);
    const key = onboardingDraftKey("user-1");
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
    localStorage.setItem(key, JSON.stringify({ ...stored, userScope: "user-2" }));

    expect(readOnboardingDraft("user-1")).toEqual({ status: "discarded", reason: "wrong_user" });
  });

  it("remove somente o rascunho do escopo informado", () => {
    saveOnboardingDraft("user-1", baseDraft);
    saveOnboardingDraft("user-2", baseDraft);

    clearOnboardingDraft("user-1");

    expect(readOnboardingDraft("user-1")).toEqual({ status: "empty" });
    expect(readOnboardingDraft("user-2").status).toBe("available");
  });

  it("aceita disciplina manual ainda sem identificador persistido", () => {
    saveOnboardingDraft("user-1", {
      ...baseDraft,
      tipo: "personalizado",
      disciplinas: [{
        nome: "Direito Constitucional",
        topicos: ["Direitos fundamentais"],
        ativa: true,
        peso: 5,
        conhecimento: "regular",
        ordem: 0,
      }],
    });

    expect(readOnboardingDraft("user-1").status).toBe("available");
  });
});
