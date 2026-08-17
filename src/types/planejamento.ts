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
