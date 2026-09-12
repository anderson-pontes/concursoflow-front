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
  baseline_fingerprint?: string | null;
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
  comparativo_aplicado?: PlanejamentoComparativo | null;
};

export type ClassificacaoComparativo = "adicionado" | "removido" | "movido" | "preservado";
export type MotivoComparativo = "SEM_ALTERACAO" | "DATA_ALTERADA" | "DURACAO_ALTERADA" | "FORA_DA_NOVA_PROPOSTA" | "NOVA_SESSAO";
export type PosicaoComparativo = { data: string; ordem_no_dia: number };
export type ItemComparativo = {
  comparacao_id: string;
  classificacao: ClassificacaoComparativo;
  motivo: MotivoComparativo;
  disciplina_id: string;
  disciplina_nome: string;
  duracao_anterior_minutos: number | null;
  duracao_nova_minutos: number | null;
  posicao_anterior: PosicaoComparativo | null;
  posicao_nova: PosicaoComparativo | null;
  par_comparacao: string | null;
};
export type ResumoComparativo = {
  antes_itens: number;
  depois_itens: number;
  antes_minutos: number;
  depois_minutos: number;
  adicionados: number;
  removidos: number;
  movidos: number;
  preservados: number;
  itens_comparativo: number;
};
export type PlanejamentoComparativo = {
  versao_contrato: 1;
  baseline_versao: "cronograma-baseline-v1";
  baseline_fingerprint: string;
  preview_fingerprint: string;
  fronteira: { data_inicio: string; data_fim_anterior: string | null; data_fim_proposta: string };
  resumo: ResumoComparativo;
  grupos: {
    adicionados: ItemComparativo[];
    removidos: ItemComparativo[];
    movidos: ItemComparativo[];
    preservados: ItemComparativo[];
  };
};
export type PlanejamentoCompararResponse = {
  preview: PlanejamentoPreview;
  comparativo: PlanejamentoComparativo;
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
