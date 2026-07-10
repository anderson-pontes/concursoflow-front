export type Disciplina = {
  id: string;
  nome: string;
  sigla: string | null;
  /** Calculados a partir dos assuntos (tópicos) — não editáveis diretamente. */
  peso: number | null;
  total_pontos?: number | null;
  prioridade_calculada?: number | null;
  dominio_medio_pct?: number | null;
  ordem: number;
  concurso_ids: string[];
  topicos_total?: number | null;
  topicos_estudados?: number | null;
};

export type DisciplinaInput = {
  nome: string;
  sigla?: string | null;
  prioridade?: number | null;
  cor_hex?: string | null;
  ordem?: number | null;
  concurso_ids?: string[];
};

export type FilterSeg = "todas" | "concurso" | "fora";
