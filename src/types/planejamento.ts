export type NivelConhecimento = "muito_fraco" | "fraco" | "regular" | "bom" | "muito_bom";
export type TipoPlanoGuiado = "catalogo" | "personalizado";

export type DisciplinaPlanoInput = {
  disciplina_id?: string | null;
  nome: string;
  sigla?: string | null;
  topicos: string[];
  ativa: boolean;
  peso: number;
  conhecimento: NivelConhecimento;
  ordem: number;
};

export type ConfigPlanejamento = {
  tipo: "ciclo" | "semanal";
  disponibilidade_minutos: Record<number, number>;
  sessao_min_minutos: number;
  sessao_max_minutos: number;
  data_inicio: string;
  data_fim: string;
};

export type PlanoGuiadoInput = {
  tipo_plano: TipoPlanoGuiado;
  nome: string;
  orgao: string;
  cargo?: string | null;
  banca?: string | null;
  data_prova?: string | null;
  observacoes?: string | null;
  catalogo?: { edital_id: string; version_id: string; cargo_id: string } | null;
  disciplinas: DisciplinaPlanoInput[];
  planejamento: ConfigPlanejamento;
  idempotency_key: string;
  preview_fingerprint?: string | null;
};

export type SessaoPlanejada = {
  disciplina_id: string | null;
  disciplina_nome: string;
  data: string;
  dia_semana: number;
  duracao_minutos: number;
  ordem: number;
};

export type PlanejamentoPreview = {
  sessoes: SessaoPlanejada[];
  minutos_totais: number;
  carga_semanal_minutos: number;
  prioridades: Record<string, number>;
  preview_fingerprint: string;
  explicacao: PlanejamentoExplicacao;
};

export type PlanejamentoCapacidade = {
  capacidade_informada_minutos: number;
  capacidade_planejavel_minutos: number;
  carga_alocada_minutos: number;
  saldo_nao_planejavel_minutos: number;
  dias_disponiveis: number;
  dias_utilizados: number;
  encaixe_calendario: "viavel";
  cobertura_edital: "indeterminada_sem_estimativa_esforco";
};

export type DisciplinaPlanejamentoExplicada = {
  disciplina_id: string | null;
  disciplina_nome: string;
  peso: number;
  conhecimento: NivelConhecimento;
  fator_conhecimento: number;
  prioridade: number;
  minutos_alocados: number;
  sessoes: number;
  dias_utilizados: number;
  participacao_bps: number;
};

export type PlanejamentoExplicacao = {
  versao_contrato: 1;
  algoritmo_versao: "planejamento-v1";
  confirmavel: boolean;
  capacidade: PlanejamentoCapacidade;
  disciplinas: DisciplinaPlanejamentoExplicada[];
  alertas: Array<"COBERTURA_EDITAL_NAO_MENSURAVEL">;
};

export type PlanoGuiadoResponse = {
  concurso_id: string;
  criado: boolean;
  disciplinas_criadas: number;
  topicos_criados: number;
  sessoes_planejadas: number;
  preview: PlanejamentoPreview;
};

export type PlanejamentoAtual = {
  concurso_id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  data_prova: string | null;
  observacoes: string | null;
  tipo_plano: string;
  disciplinas: DisciplinaPlanoInput[];
  planejamento: ConfigPlanejamento;
};
