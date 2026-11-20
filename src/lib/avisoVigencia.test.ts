import { describe, expect, it } from "vitest";
import { avisoStatus, erroVigencia } from "@/lib/avisoVigencia";

const periodo = { data_inicio: "2026-12-01", data_fim: "2026-12-10", data_vencimento: "2026-12-15" };

describe("vigência dos avisos", () => {
  it.each([
    ["2026-11-30", "agendado"],
    ["2026-12-01", "ativo"],
    ["2026-12-10", "ativo"],
    ["2026-12-11", "encerrado"],
    ["2026-12-15", "encerrado"],
  ])("classifica em %s como %s", (hoje, status) => {
    expect(avisoStatus(periodo, hoje)).toBe(status);
  });

  it("aceita lembretes de um dia e rejeita intervalos invertidos ou incompletos", () => {
    expect(erroVigencia({ ...periodo, data_fim: periodo.data_inicio })).toBe("");
    expect(erroVigencia({ ...periodo, data_fim: "2026-11-30" })).toMatch(/posterior/);
    expect(erroVigencia({ ...periodo, data_fim: "" })).toMatch(/Informe/);
  });
});
