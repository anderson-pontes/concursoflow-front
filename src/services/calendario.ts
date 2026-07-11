import { api } from "@/services/api";
import type { CalendarioMesResponse, DiaDetalheResponse } from "@/lib/calendario/types";

export async function fetchCalendarioMes(params: {
  ano: number;
  mes: number;
  concursoId?: string | null;
}): Promise<CalendarioMesResponse> {
  const search = new URLSearchParams({
    ano: String(params.ano),
    mes: String(params.mes),
  });
  if (params.concursoId) search.set("concurso_id", params.concursoId);
  return (await api.get(`/cronograma/calendario?${search}`)).data as CalendarioMesResponse;
}

export async function fetchDiaDetalhe(params: {
  data: string;
  concursoId?: string | null;
}): Promise<DiaDetalheResponse> {
  const search = new URLSearchParams();
  if (params.concursoId) search.set("concurso_id", params.concursoId);
  const qs = search.toString();
  return (
    await api.get(`/sessoes-estudo/dia/${params.data}${qs ? `?${qs}` : ""}`)
  ).data as DiaDetalheResponse;
}
