export type DisciplinaDashboardKpis = {
  tempo_estudo_horas: number;
  desempenho_geral_pct: number;
  questoes_certas_total: number;
  questoes_erradas_total: number;
  questoes_branco_total: number;
  questoes_resolvidas_total: number;
  progresso_edital_pct: number;
  topicos_concluidos: number;
  topicos_pendentes: number;
  topicos_total: number;
  paginas_lidas_total: number;
};

export type DisciplinaDashboardTopicoRow = {
  id: string;
  descricao: string;
  numero_ordem: number;
  concluido_edital: boolean;
  certas: number;
  erradas: number;
  em_branco: number;
  aproveitamento_pct: number;
  tempo_estudo_minutos: number;
  paginas_lidas: number;
};

export type DisciplinaDashboardResponse = {
  disciplina_id: string;
  nome: string;
  kpis: DisciplinaDashboardKpis;
  topicos: DisciplinaDashboardTopicoRow[];
};
