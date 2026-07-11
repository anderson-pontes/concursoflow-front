export type SessaoEstudoRow = {
  id: string;
  user_id: string;
  disciplina_id: string;
  topico_id: string | null;
  topico_ids: string[];
  plano_id: string | null;
  categoria_id: string | null;
  data_referencia: string | null;
  inicio: string;
  fim: string | null;
  duracao_minutos: number;
  tempo_estudo_segundos: number;
  tipo: string;
  pomodoros_concluidos: number;
  anotacoes: string | null;
  material: string | null;
  teoria_finalizada: boolean;
  contabilizar_no_planejamento: boolean;
  programar_revisoes: boolean;
  revisoes_dias: number[];
  questoes_acertos: number;
  questoes_erros: number;
  questoes_em_branco: number;
  paginas_blocos: { inicio: number; fim: number }[];
  videoaulas_blocos: unknown[];
  comentarios: string | null;
  created_at: string;
};

export type HistoricoListResumo = {
  total_minutos: number;
  total_sessoes: number;
  total_questoes: number;
  rendimento_pct: number;
};

export type SessaoEstudoListResponse = {
  items: SessaoEstudoRow[];
  total: number;
  page: number;
  page_size: number;
  resumo: HistoricoListResumo;
};

export type AgruparPor = "dia" | "disciplina" | "semana" | "mes";

export type HistoricoAgregadoPonto = {
  chave: string;
  label: string;
  minutos: number;
  sessoes: number;
  questoes: number;
  rendimento_pct: number;
};

export type HistoricoAgregadoResponse = {
  agrupar_por: AgruparPor;
  data_inicio: string;
  data_fim: string;
  serie: HistoricoAgregadoPonto[];
  total_minutos: number;
  total_sessoes: number;
};

export type HistoricoFilters = {
  dataInicio: string;
  dataFim: string;
  disciplinaId?: string;
  topicoId?: string;
  concursoId?: string;
  tipo?: string;
  page: number;
  pageSize: number;
};
