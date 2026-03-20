export type PlanoStatus = "ativo" | "pausado" | "encerrado";

export interface PlanoStatsResponse {
  disciplinas_qty: number;
  topicos_total: number;
  topicos_estudados: number;
  progresso_pct: number;
}

export interface TopicoPlano {
  id: string;
  topicoId: string;
  nome: string;
  estudado: boolean;
  dataEstudo?: string;
  anotacoes?: string;
}

export interface DisciplinaPlano {
  id: string;
  disciplinaId: string;
  codigo: string;
  nome: string;
  pesoEdital: number;
  cor: string;
  topicos: TopicoPlano[];
}

export interface PlanoEstudo {
  id: string;
  nome: string;
  orgao: string;
  cargo: string;
  banca?: string;
  dataProva?: string;
  editalUrl?: string;
  logoUrl?: string;
  status: PlanoStatus;
  ativo: boolean;
  stats: PlanoStatsResponse;
  createdAt: string;
  updatedAt: string;
}

export type CreatePlanoDTO = Omit<PlanoEstudo, "id" | "stats" | "createdAt" | "updatedAt" | "ativo"> & {
  ativo: boolean;
};

export type CreateDisciplinaDTO = {
  disciplinaId: string;
  codigo?: string;
  pesoEdital?: number;
  cor?: string;
  observacoes?: string;
};

