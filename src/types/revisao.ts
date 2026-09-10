export type RevisaoGrupo = "hoje" | "atrasadas" | "proximas" | "concluidas" | "ignoradas";

export type RevisaoStatus = "pendente" | "concluida" | "ignorada" | "cancelada";

export type RevisaoOrigem = "ciclo_topico" | "sessao_programada";

export type RevisaoItem = {
  id: string;
  versao: number;
  concurso_id: string;
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string;
  topico_nome: string;
  origem_tipo: RevisaoOrigem;
  origem_sessao_id: string | null;
  regra_versao: string;
  ciclo_indice: number | null;
  intervalo_dias: number;
  data_prevista_original: string;
  data_prevista_atual: string;
  timezone: string;
  status: RevisaoStatus;
  ultima_transicao_em: string;
};

export type RevisoesPage = {
  grupo: RevisaoGrupo;
  items: RevisaoItem[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
};

export type RevisaoListFilters = {
  grupo: RevisaoGrupo;
  disciplinaId?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  limit?: number;
};

export type RevisaoListParams = RevisaoListFilters & {
  concursoId: string;
  cursor?: string | null;
};

export type RevisaoSessaoConclusao = {
  inicio: string;
  fim: string;
  tempo_estudo_segundos?: number;
};

export type RevisaoComandoResponse = {
  id: string;
  concurso_id: string;
  status: RevisaoStatus;
  versao: number;
  data_prevista_original: string;
  data_prevista_atual: string;
  conclusao_sessao_id: string | null;
  transicao: {
    tipo: "reagendada" | "ignorada" | "concluida";
    ocorrido_em: string;
  };
  idempotency_replayed: boolean;
};
