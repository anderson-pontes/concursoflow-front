import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { isConcursoContextQueryKey } from "@/lib/concursos/context";
import { invalidateRevisaoContext, revisoesKeys } from "@/lib/revisoes/queryKeys";

describe("revisoes query keys", () => {
  it("segmenta a fila por concurso, grupo e filtros sem incluir o cursor", () => {
    expect(revisoesKeys.list("concurso-a", {
      grupo: "hoje",
      disciplinaId: "disciplina-1",
      dataInicio: "2026-09-01",
      dataFim: null,
    })).toEqual([
      "revisoes",
      "concurso-a",
      "hoje",
      "disciplina-1",
      "2026-09-01",
      null,
    ]);
  });

  it("classifica a Central como cache contextual para a troca de concurso", () => {
    expect(isConcursoContextQueryKey(revisoesKeys.context("concurso-a"))).toBe(true);
  });

  it("invalida somente Central, dashboard e histórico do concurso afetado", async () => {
    const queryClient = new QueryClient();
    const keys = {
      revisaoA: revisoesKeys.list("concurso-a", { grupo: "hoje" }),
      revisaoB: revisoesKeys.list("concurso-b", { grupo: "hoje" }),
      dashboardA: ["dashboard", "revisoes-pendentes", "concurso-a"] as const,
      dashboardB: ["dashboard", "revisoes-pendentes", "concurso-b"] as const,
      historicoA: ["historico-sessoes", { concursoId: "concurso-a" }] as const,
      historicoB: ["historico-sessoes", { concursoId: "concurso-b" }] as const,
    };
    Object.values(keys).forEach((key) => queryClient.setQueryData(key, { ok: true }));

    await invalidateRevisaoContext(queryClient, "concurso-a");

    expect(queryClient.getQueryState(keys.revisaoA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(keys.dashboardA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(keys.historicoA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(keys.revisaoB)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(keys.dashboardB)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(keys.historicoB)?.isInvalidated).toBe(false);
  });
});
