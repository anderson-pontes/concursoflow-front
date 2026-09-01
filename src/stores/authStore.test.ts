import { beforeEach, describe, expect, it } from "vitest";

import { readOnboardingDraft, saveOnboardingDraft } from "@/lib/onboardingDraftStorage";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

const user = { id: "user-logout" } as AuthUser;

describe("authStore logout", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: "token", refreshToken: "refresh", user });
  });

  it("limpa o rascunho de onboarding do usuário que encerrou a sessão", () => {
    saveOnboardingDraft(user.id, {
      idempotencyKey: "idempotency-logout",
      step: 2,
      tipo: "personalizado",
      busca: "",
      editalId: null,
      versionId: null,
      cargoId: null,
      nome: "Plano local",
      orgao: "Órgão",
      cargoNome: "",
      banca: "",
      dataProva: "",
      observacoes: "",
      disciplinas: [],
      config: {
        tipo: "ciclo",
        disponibilidade_minutos: { 0: 60 },
        sessao_min_minutos: 25,
        sessao_max_minutos: 50,
        data_inicio: "2026-09-01",
        data_fim: "2026-12-01",
      },
    });

    useAuthStore.getState().logout();

    expect(readOnboardingDraft(user.id)).toEqual({ status: "empty" });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
