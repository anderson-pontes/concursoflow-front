import { dashboardDayISO } from "@/lib/dashboard/analysis";

export type AvisoPeriodo = { data_inicio: string; data_fim: string };
export type AvisoStatus = "ativo" | "agendado" | "encerrado";

export const avisoStatusLabel = {
  ativo: "Ativo",
  agendado: "Agendado",
  encerrado: "Encerrado",
} satisfies Record<AvisoStatus, string>;

export function avisoStatus(periodo: AvisoPeriodo, hoje = dashboardDayISO()): AvisoStatus {
  if (hoje < periodo.data_inicio) return "agendado";
  return hoje > periodo.data_fim ? "encerrado" : "ativo";
}

export function erroVigencia({ data_inicio, data_fim }: AvisoPeriodo) {
  if (!data_inicio || !data_fim) return "Informe o início e o término da vigência.";
  if (data_fim < data_inicio) return "O término deve ser igual ou posterior ao início.";
  return "";
}
