import { api } from "@/services/api";
import type { ConfigPlanejamento, DisciplinaPlanoInput, PlanejamentoPreview, PlanoGuiadoInput, PlanoGuiadoResponse } from "@/types/planejamento";

export async function previewPlanejamento(disciplinas: DisciplinaPlanoInput[], planejamento: ConfigPlanejamento) {
  return (await api.post<PlanejamentoPreview>("/concursos/planejamento/preview", { disciplinas, planejamento })).data;
}

export async function confirmarPlanoGuiado(input: PlanoGuiadoInput) {
  return (await api.post<PlanoGuiadoResponse>("/concursos/planejamento/confirmar", input)).data;
}
