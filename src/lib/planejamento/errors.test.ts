import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { isPlanejamentoPreviewDesatualizado, planejamentoCapacidadeDiagnostico } from "@/lib/planejamento/errors";

function axiosError(status: number, detail: unknown): AxiosError {
  return new AxiosError("erro", undefined, undefined, undefined, {
    data: { detail },
    status,
    statusText: "Erro",
    headers: {},
    config: { headers: {} } as never,
  });
}

describe("erros explicáveis de planejamento", () => {
  it("converte o diagnóstico estruturado de capacidade", () => {
    const result = planejamentoCapacidadeDiagnostico(axiosError(422, {
      code: "PLANEJAMENTO_CAPACIDADE_INSUFICIENTE",
      motivo: "PLANEJAMENTO_DISCIPLINAS_SEM_SLOT",
      diagnostico: {
        capacidade_informada_minutos: 60,
        capacidade_planejavel_minutos: 60,
        dias_disponiveis: 1,
        slots: 1,
        disciplinas: 3,
      },
    }));

    expect(result).toEqual({
      motivo: "PLANEJAMENTO_DISCIPLINAS_SEM_SLOT",
      capacidadeInformadaMinutos: 60,
      capacidadePlanejavelMinutos: 60,
      diasDisponiveis: 1,
      slots: 1,
      disciplinas: 3,
    });
  });

  it("distingue conflito de prévia obsoleta", () => {
    expect(isPlanejamentoPreviewDesatualizado(axiosError(409, { code: "PLANEJAMENTO_PREVIEW_DESATUALIZADO" }))).toBe(true);
    expect(isPlanejamentoPreviewDesatualizado(axiosError(409, "outro erro"))).toBe(false);
  });
});
