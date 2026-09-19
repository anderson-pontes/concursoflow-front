import { describe, expect, it } from "vitest";

import { findPrimaryEditalAction, mapEditalActions } from "@/lib/edital/editalActions";

const item = {
  dominio: 5,
  proxima_revisao_id: "revisao-1",
  proxima_revisao_versao: 2,
};

describe("mapEditalActions", () => {
  it("prioriza revisão auditável elegível", () => {
    const actions = mapEditalActions({ concursoStatus: "ativo", item, hasValidDuration: true });
    expect(findPrimaryEditalAction(actions)?.id).toBe("review");
    expect(actions.find((action) => action.id === "study")?.state).toBe("available");
  });

  it("prioriza estudo quando não há revisão e mantém registro disponível", () => {
    const actions = mapEditalActions({
      concursoStatus: "ativo",
      item: { ...item, proxima_revisao_id: null, proxima_revisao_versao: null },
      hasValidDuration: true,
    });
    expect(findPrimaryEditalAction(actions)?.id).toBe("study");
    expect(actions.find((action) => action.id === "review")?.state).toBe("hidden");
    expect(actions.find((action) => action.id === "register")?.state).toBe("available");
  });

  it("bloqueia mutações fora do concurso ativo e preserva abertura do tópico", () => {
    const actions = mapEditalActions({ concursoStatus: "suspenso", item, hasValidDuration: true });
    expect(actions.filter((action) => ["review", "study", "register"].includes(action.id)))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "review", state: "disabled", reason: "CONTEST_NOT_ACTIVE" }),
        expect.objectContaining({ id: "study", state: "disabled", reason: "CONTEST_NOT_ACTIVE" }),
        expect.objectContaining({ id: "register", state: "disabled", reason: "CONTEST_NOT_ACTIVE" }),
      ]));
    expect(actions.find((action) => action.id === "open_topic")?.state).toBe("available");
  });

  it("não inventa duração quando a configuração persistida é inválida", () => {
    const actions = mapEditalActions({ concursoStatus: "ativo", item, hasValidDuration: false });
    expect(actions.find((action) => action.id === "review")).toMatchObject({ state: "disabled", reason: "INVALID_DURATION" });
    expect(actions.find((action) => action.id === "study")).toMatchObject({ state: "disabled", reason: "INVALID_DURATION" });
  });
});
