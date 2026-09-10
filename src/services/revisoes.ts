import { api } from "@/services/api";
import type {
  RevisaoComandoResponse,
  RevisaoListParams,
  RevisaoSessaoConclusao,
  RevisoesPage,
} from "@/types/revisao";

type RevisaoCommandContext = {
  revisaoId: string;
  concursoId: string;
  versaoEsperada: number;
  idempotencyKey: string;
};

function commandConfig(context: RevisaoCommandContext) {
  return {
    params: { concurso_id: context.concursoId },
    headers: { "Idempotency-Key": context.idempotencyKey },
  };
}

export async function listarRevisoes(params: RevisaoListParams): Promise<RevisoesPage> {
  const { data } = await api.get<RevisoesPage>("/revisoes", {
    params: {
      concurso_id: params.concursoId,
      grupo: params.grupo,
      disciplina_id: params.disciplinaId || undefined,
      data_inicio: params.dataInicio || undefined,
      data_fim: params.dataFim || undefined,
      cursor: params.cursor || undefined,
      limit: params.limit,
    },
  });
  return data;
}

export async function concluirRevisao(
  context: RevisaoCommandContext,
  sessao: RevisaoSessaoConclusao,
): Promise<RevisaoComandoResponse> {
  const { data } = await api.post<RevisaoComandoResponse>(
    `/revisoes/${context.revisaoId}/concluir`,
    { versao_esperada: context.versaoEsperada, sessao },
    commandConfig(context),
  );
  return data;
}

export async function reagendarRevisao(
  context: RevisaoCommandContext,
  novaData: string,
): Promise<RevisaoComandoResponse> {
  const { data } = await api.post<RevisaoComandoResponse>(
    `/revisoes/${context.revisaoId}/reagendar`,
    { versao_esperada: context.versaoEsperada, nova_data: novaData },
    commandConfig(context),
  );
  return data;
}

export async function ignorarRevisao(context: RevisaoCommandContext): Promise<RevisaoComandoResponse> {
  const { data } = await api.post<RevisaoComandoResponse>(
    `/revisoes/${context.revisaoId}/ignorar`,
    { versao_esperada: context.versaoEsperada },
    commandConfig(context),
  );
  return data;
}
