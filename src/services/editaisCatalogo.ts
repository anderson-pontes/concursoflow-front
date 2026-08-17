import { api } from "@/services/api";
import type {
  AtivacaoEditalResponse,
  EditalCatalogo,
  EditalCatalogoInput,
  EditalCatalogoInitialInput,
  EditalCatalogoPage,
  EditalCargoCatalogo,
  ImportacaoResumo,
} from "@/types/editaisCatalogo";

type PageEnvelope<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type RawEdital = Omit<EditalCatalogo, "status" | "versao_atual" | "url_oficial"> & {
  status?: EditalCatalogo["status"];
  versao_atual?: EditalCatalogo["versao_atual"];
  edital_url?: string | null;
  url_oficial?: string | null;
  updated_at?: string;
};

function normalize(raw: RawEdital, publicOnly = false): EditalCatalogo {
  const versoes = (raw.versoes ?? []).map((versao) => ({
    ...versao,
    numero: String(versao.numero),
    publicada_em: versao.publicada_em ?? versao.published_at ?? null,
    cargos: (versao.cargos ?? []).map((cargo) => ({
      ...cargo,
      disciplinas: (cargo.disciplinas ?? []).map((disciplina) => ({
        ...disciplina,
        topicos: (disciplina.topicos ?? []).map((topico) => ({ ...topico, ordem: topico.ordem ?? topico.numero_ordem ?? 0 })),
      })),
    })),
  }));
  const versaoAtual = raw.versao_atual ?? (publicOnly
    ? versoes.find((item) => item.status === "publicado")
    : versoes.find((item) => item.status === "rascunho") ?? versoes.find((item) => item.status === "publicado") ?? versoes[0]) ?? null;
  const status = raw.status ?? versaoAtual?.status ?? "rascunho";
  return { ...raw, atualizado_em: raw.atualizado_em ?? raw.updated_at, logo_url: raw.logo_url ?? null, status, url_oficial: raw.url_oficial ?? raw.edital_url ?? null, versoes, versao_atual: versaoAtual };
}

function normalizePage(data: PageEnvelope<RawEdital> | RawEdital[], publicOnly = false): EditalCatalogoPage {
  if (Array.isArray(data)) {
    return { items: data.map((item) => normalize(item, publicOnly)), page: 1, page_size: data.length || 12, total: data.length, total_pages: data.length ? 1 : 0 };
  }
  return { ...data, items: data.items.map((item) => normalize(item, publicOnly)) };
}

export async function paginarEditaisAdmin(params: { search?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<EditalCatalogoPage> {
  const { search = "", status = "", page = 1, pageSize = 12 } = params;
  const { data } = await api.get<PageEnvelope<RawEdital> | RawEdital[]>("/admin/editais", {
    params: { search: search || undefined, status: status || undefined, page, page_size: pageSize },
  });
  return normalizePage(data);
}

export async function listarEditaisAdmin(search = "", status = ""): Promise<EditalCatalogo[]> {
  return (await paginarEditaisAdmin({ search, status, pageSize: 50 })).items;
}

export async function obterEditalAdmin(id: string): Promise<EditalCatalogo> {
  return normalize((await api.get<RawEdital>(`/admin/editais/${id}`)).data);
}

export async function criarEditalAdmin(input: EditalCatalogoInitialInput): Promise<EditalCatalogo> {
  const form = new FormData();
  form.append("nome", input.nome.trim());
  form.append("orgao", input.orgao.trim());
  form.append("cargo_nome", input.cargo_nome.trim());
  if (input.banca?.trim()) form.append("banca", input.banca.trim());
  if (input.url_oficial?.trim()) form.append("edital_url", input.url_oficial.trim());
  if (input.arquivo) form.append("file", input.arquivo);
  if (input.logo) form.append("logo", input.logo);
  const created = (await api.post<RawEdital>("/admin/editais/inicializar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;
  return normalize(created);
}

export async function atualizarEditalAdmin(id: string, input: EditalCatalogoInput): Promise<EditalCatalogo> {
  const payload = { nome: input.nome, orgao: input.orgao, banca: input.banca, edital_url: input.url_oficial };
  return normalize((await api.put<RawEdital>(`/admin/editais/${id}`, payload)).data);
}

export async function uploadEditalAdmin(id: string, file: File): Promise<EditalCatalogo> {
  const form = new FormData();
  form.append("file", file);
  return normalize((await api.post<RawEdital>(`/admin/editais/${id}/upload-edital`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data);
}

export async function uploadLogoAdmin(id: string, logo: File): Promise<EditalCatalogo> {
  const form = new FormData();
  form.append("logo", logo);
  return normalize((await api.post<RawEdital>(`/admin/editais/${id}/upload-logo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data);
}

export async function criarVersaoRascunho(editalId: string): Promise<EditalCatalogo> {
  const edital = await obterEditalAdmin(editalId);
  const numero = Math.max(0, ...(edital.versoes ?? []).map((item) => Number(item.numero) || 0)) + 1;
  await api.post(`/admin/editais/${editalId}/versoes`, { numero, data_prova: null });
  return obterEditalAdmin(editalId);
}

export async function salvarEstruturaVersao(
  editalId: string,
  versaoId: string,
  cargos: EditalCargoCatalogo[],
): Promise<EditalCatalogo> {
  const persistedId = (id: string) => id.startsWith("novo-") ? undefined : id;
  const payload = {
    cargos: cargos.map((cargo) => ({
      id: persistedId(cargo.id),
      nome: cargo.nome.trim(),
      ordem: cargo.ordem,
      disciplinas: cargo.disciplinas.map((disciplina) => ({
        id: persistedId(disciplina.id),
        nome: disciplina.nome.trim(),
        sigla: disciplina.sigla?.trim() || null,
        ordem: disciplina.ordem,
        topicos: disciplina.topicos.map((topico) => ({
          id: persistedId(topico.id),
          descricao: topico.descricao.trim(),
          numero_ordem: topico.ordem,
          peso: topico.peso,
        })),
      })),
    })),
  };
  return (await api.put<EditalCatalogo>(`/admin/editais/${editalId}/versoes/${versaoId}/estrutura`, payload)).data;
}

export async function publicarVersao(editalId: string, versaoId: string): Promise<EditalCatalogo> {
  return (await api.post<EditalCatalogo>(`/admin/editais/${editalId}/versoes/${versaoId}/publicar`)).data;
}

export async function arquivarEdital(editalId: string): Promise<void> {
  const edital = await obterEditalAdmin(editalId);
  const versao = edital.versoes?.find((item) => item.status === "publicado") ?? edital.versao_atual;
  if (!versao) throw new Error("Edital sem versão para arquivar");
  await api.post(`/admin/editais/${editalId}/versoes/${versao.id}/arquivar`);
}

export async function importarVerticalizacao(
  editalId: string,
  versaoId: string,
  file: File,
  aplicar: boolean,
): Promise<ImportacaoResumo> {
  const form = new FormData();
  form.append("file", file);
  return (
    await api.post<ImportacaoResumo>(`/admin/editais/${editalId}/versoes/${versaoId}/importar`, form, {
      headers: { "Content-Type": "multipart/form-data" }, params: { aplicar },
    })
  ).data;
}

export async function listarEditaisPublicados(search = ""): Promise<EditalCatalogo[]> {
  return (await paginarEditaisPublicados({ search, pageSize: 50 })).items;
}

export async function paginarEditaisPublicados(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<EditalCatalogoPage> {
  const { search = "", page = 1, pageSize = 12 } = params;
  const { data } = await api.get<PageEnvelope<RawEdital> | RawEdital[]>("/catalogo/editais", {
    params: { search: search || undefined, page, page_size: pageSize },
  });
  return normalizePage(data, true);
}

export async function obterEditalPublicado(id: string): Promise<EditalCatalogo> {
  return normalize((await api.get<RawEdital>(`/catalogo/editais/${id}`)).data, true);
}

export async function ativarEdital(params: {
  templateId: string;
  versionId: string;
  cargoId: string;
  disciplinaIds: string[];
  idempotencyKey: string;
}): Promise<AtivacaoEditalResponse> {
  const { templateId, versionId, cargoId, disciplinaIds, idempotencyKey } = params;
  return (
    await api.post<AtivacaoEditalResponse>(
      `/catalogo/editais/${templateId}/versoes/${versionId}/cargos/${cargoId}/ativar`,
      { disciplina_ids: disciplinaIds, idempotency_key: idempotencyKey },
    )
  ).data;
}
