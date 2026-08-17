import { api } from "@/services/api";
import type {
  ConfigPlanejamento,
  DisciplinaPlanoInput,
  PlanejamentoAtual,
  PlanejamentoPreview,
  PlanoGuiadoInput,
  PlanoGuiadoResponse,
} from "@/types/planejamento";

export async function previewPlanejamento(disciplinas: DisciplinaPlanoInput[], planejamento: ConfigPlanejamento) {
  return (await api.post<PlanejamentoPreview>("/concursos/planejamento/preview", { disciplinas, planejamento })).data;
}

export async function confirmarPlanoGuiado(input: PlanoGuiadoInput) {
  return (await api.post<PlanoGuiadoResponse>("/concursos/planejamento/confirmar", input)).data;
}

export async function obterPlanejamentoAtual(concursoId: string) {
  return (await api.get<PlanejamentoAtual>(`/concursos/${concursoId}/planejamento`)).data;
}

export async function recalcularPlano(concursoId: string, input: PlanoGuiadoInput) {
  return (
    await api.post<PlanoGuiadoResponse>(
      `/concursos/${concursoId}/planejamento/recalcular`,
      input,
      { params: { confirmado: true } },
    )
  ).data;
}
