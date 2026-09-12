import { isAxiosError } from "axios";

export type PlanejamentoCapacidadeDiagnostico = {
  motivo: "PLANEJAMENTO_SEM_SLOTS" | "PLANEJAMENTO_DISCIPLINAS_SEM_SLOT";
  capacidadeInformadaMinutos: number;
  capacidadePlanejavelMinutos: number;
  diasDisponiveis: number;
  slots: number;
  disciplinas: number;
};

type ErrorDetail = {
  code?: string;
  motivo?: PlanejamentoCapacidadeDiagnostico["motivo"];
  diagnostico?: {
    capacidade_informada_minutos?: number;
    capacidade_planejavel_minutos?: number;
    dias_disponiveis?: number;
    slots?: number;
    disciplinas?: number;
  };
};

export function planejamentoCapacidadeDiagnostico(
  error: unknown,
): PlanejamentoCapacidadeDiagnostico | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null;
  const detail = error.response.data?.detail as ErrorDetail | undefined;
  if (
    detail?.code !== "PLANEJAMENTO_CAPACIDADE_INSUFICIENTE"
    || !detail.motivo
    || !detail.diagnostico
  ) return null;
  return {
    motivo: detail.motivo,
    capacidadeInformadaMinutos: detail.diagnostico.capacidade_informada_minutos ?? 0,
    capacidadePlanejavelMinutos: detail.diagnostico.capacidade_planejavel_minutos ?? 0,
    diasDisponiveis: detail.diagnostico.dias_disponiveis ?? 0,
    slots: detail.diagnostico.slots ?? 0,
    disciplinas: detail.diagnostico.disciplinas ?? 0,
  };
}

export function isPlanejamentoPreviewDesatualizado(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 409) return false;
  const detail = error.response.data?.detail as ErrorDetail | undefined;
  return detail?.code === "PLANEJAMENTO_PREVIEW_DESATUALIZADO";
}
