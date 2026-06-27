import type { ConcursoFormInput } from "@/components/concursos/ModalConcurso";

export type Concurso = {
  id: string;
  user_id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  logo_url: string | null;
  data_prova: string | null;
  status: string;
  created_at: string;
};

export type ConcursoStatusFilter = "todos" | "ativos" | "encerrados";

export const DEFAULT_CONCURSO_INPUT: ConcursoFormInput = {
  nome: "",
  orgao: "",
  cargo: null,
  banca: null,
  data_prova: null,
  status: "ativo",
  logo_file: null,
  edital_file: null,
};
