import type {
  HistoricoAgregadoResponse,
  HistoricoFilters,
  SessaoEstudoListResponse,
} from "@/lib/historico/types";
import { api } from "@/services/api";

function buildSearch(filters: Partial<HistoricoFilters>): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.dataInicio) p.set("data_inicio", filters.dataInicio);
  if (filters.dataFim) p.set("data_fim", filters.dataFim);
  if (filters.disciplinaId) p.set("disciplina_id", filters.disciplinaId);
  if (filters.topicoId) p.set("topico_id", filters.topicoId);
  if (filters.concursoId) p.set("concurso_id", filters.concursoId);
  if (filters.tipo) p.set("tipo", filters.tipo);
  if (filters.page) p.set("page", String(filters.page));
  if (filters.pageSize) p.set("page_size", String(filters.pageSize));
  return p;
}

export async function fetchHistoricoSessoes(
  filters: HistoricoFilters,
): Promise<SessaoEstudoListResponse> {
  return (await api.get(`/sessoes-estudo?${buildSearch(filters)}`)).data as SessaoEstudoListResponse;
}

export async function fetchHistoricoAgregado(params: {
  dataInicio: string;
  dataFim: string;
  agruparPor: string;
  concursoId?: string | null;
}): Promise<HistoricoAgregadoResponse> {
  const p = new URLSearchParams({
    data_inicio: params.dataInicio,
    data_fim: params.dataFim,
    agrupar_por: params.agruparPor,
  });
  if (params.concursoId) p.set("concurso_id", params.concursoId);
  return (await api.get(`/sessoes-estudo/agregado?${p}`)).data as HistoricoAgregadoResponse;
}
