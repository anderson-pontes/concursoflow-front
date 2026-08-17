export type EditalStatus = "rascunho" | "publicado" | "arquivado";

export type EditalTopicoCatalogo = {
  id: string;
  descricao: string;
  ordem: number;
  numero_ordem?: number;
  peso: number;
};

export type EditalDisciplinaCatalogo = {
  id: string;
  nome: string;
  sigla: string | null;
  ordem: number;
  topicos: EditalTopicoCatalogo[];
  topicos_total?: number;
};

export type EditalCargoCatalogo = {
  id: string;
  nome: string;
  especialidade?: string | null;
  ordem: number;
  disciplinas: EditalDisciplinaCatalogo[];
  disciplinas_total?: number;
  topicos_total?: number;
};

export type EditalVersaoCatalogo = {
  id: string;
  numero: string;
  status: EditalStatus;
  publicada_em: string | null;
  published_at?: string | null;
  data_prova?: string | null;
  cargos: EditalCargoCatalogo[];
};

export type EditalCatalogo = {
  id: string;
  nome: string;
  orgao: string;
  banca: string | null;
  url_oficial: string | null;
  logo_url: string | null;
  status: EditalStatus;
  versao_atual: EditalVersaoCatalogo | null;
  versoes?: EditalVersaoCatalogo[];
  cargos_total?: number;
  disciplinas_total?: number;
  atualizado_em?: string;
};

export type EditalCatalogoInput = Pick<EditalCatalogo, "nome" | "orgao" | "banca" | "url_oficial">;

export type EditalCatalogoInitialInput = EditalCatalogoInput & {
  cargo_nome: string;
  arquivo: File | null;
  logo: File | null;
};

export type EditalCatalogoPage = {
  items: EditalCatalogo[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ImportacaoErro = {
  linha: number | null;
  campo: string | null;
  mensagem: string;
};

export type ImportacaoResumo = {
  valido: boolean;
  cargos: number;
  disciplinas: number;
  topicos: number;
  linhas_ignoradas: number;
  erros: ImportacaoErro[];
};

export type AtivacaoEditalResponse = {
  concurso_id: string;
  template_id: string;
  version_id: string;
  cargo_id: string;
  disciplinas_criadas: number;
  topicos_criados: number;
};
