import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";

describe("invalidateEstudosQueries", () => {
  it("invalida recortes do edital após estudo, preservando os dados até a próxima consulta", () => {
    const client = new QueryClient();
    const key = ["edital-verticalizado", "concurso-1", { status: ["nao_iniciado"] }];
    const data = { atividade: "2026-10-14", status: "nao_iniciado" };
    client.setQueryData(key, data);
    client.setQueryData(["concursos"], ["concurso-1"]);
    invalidateEstudosQueries(client);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryData(key)).toEqual(data);
    expect(client.getQueryState(["concursos"])?.isInvalidated).toBe(false);
  });
});
