import { api } from "@/services/api";
import type { EditalConsulta, EditalVerticalizadoPage } from "@/types/editalVerticalizado";

export async function consultarEditalVerticalizado(concursoId: string, query: EditalConsulta, cursor: string | null, signal?: AbortSignal): Promise<EditalVerticalizadoPage> {
  const { data } = await api.post<EditalVerticalizadoPage>(`/concursos/${concursoId}/edital-verticalizado/consulta`, { ...query, cursor }, { signal });
  return data;
}
