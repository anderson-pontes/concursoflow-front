export type Disciplina = {
  id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  total_questoes_prova: number | null;
  total_pontos?: number | null;
  ordem: number;
  concurso_ids: string[];
  topicos_total?: number | null;
  topicos_estudados?: number | null;
};

export type DisciplinaInput = {
  nome: string;
  sigla?: string | null;
  total_questoes_prova?: number | null;
  peso?: number | null;
  prioridade?: number | null;
  cor_hex?: string | null;
  ordem?: number | null;
  concurso_ids?: string[];
};

export type FilterSeg = "todas" | "concurso" | "fora";
