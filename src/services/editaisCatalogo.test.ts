import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/services/api";
import {
  atualizarEditalAdmin,
  criarEditalAdmin,
  obterEditalAdmin,
  removerEditalAdmin,
  paginarEditaisAdmin,
  paginarEditaisPublicados,
  salvarCronogramaVersao,
} from "@/services/editaisCatalogo";

vi.mock("@/services/api", () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const rawEdital = {
  id: "edital-1",
  nome: "Concurso exemplo",
  orgao: "Órgão exemplo",
  banca: "Banca",
  url_oficial: "https://example.test/concurso",
  edital_url: "/uploads/editais-catalogo/edital-1/edital.pdf",
  logo_url: null,
  status: "rascunho",
  atualizado_em: "2026-10-01T00:00:00Z",
  versao_atual: null,
  versoes: [],
};

describe("contrato do catálogo administrativo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mantém publicado o edital com rascunho e seleciona a versão publicada no catálogo público", async () => {
    const classification = { esfera: null, areas: [], ano_edital: null, revision: 0, fonte_tipo: null, updated_at: null };
    const published = { id: "published", numero: 1, status: "publicado", classificacao: classification, cargos: [], data_prova: "2026-12-01" };
    const draft = { ...published, id: "draft", numero: 2, status: "rascunho" };
    vi.mocked(api.get).mockResolvedValue({ data: [{ ...rawEdital, versoes: [published, draft] }] });
    const admin = await paginarEditaisAdmin({ status: "publicado" });
    expect(admin.items[0].status).toBe("publicado");
    expect(admin.items[0].versao_atual?.id).toBe("draft");
    const publicPage = await paginarEditaisPublicados();
    expect(publicPage.items[0].versao_atual?.id).toBe("published");
  });

  it("envia as datas no cadastro e null explícito para limpar o cronograma", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: rawEdital });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    await criarEditalAdmin({ nome: "Edital", orgao: "QA", banca: null, url_oficial: null, cargo_nome: "Analista", arquivo: null, logo: null, data_prova: "2026-12-01", inicio_inscricoes: "2026-10-01" });
    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get("data_prova")).toBe("2026-12-01");
    expect(form.has("limite_pagamento")).toBe(false);
    await salvarCronogramaVersao("edital-1", "version-1", {});
    expect(api.put).toHaveBeenCalledWith("/admin/editais/edital-1/versoes/version-1/cronograma", { inicio_inscricoes: null, encerramento_inscricoes: null, limite_pagamento: null, data_prova: null });
  });

  it("mantém URL oficial e documento em campos independentes ao consultar", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: rawEdital });

    const result = await obterEditalAdmin("edital-1");

    expect(result.url_oficial).toBe("https://example.test/concurso");
    expect(result.edital_url).toBe("/uploads/editais-catalogo/edital-1/edital.pdf");
  });

  it("envia somente url_oficial na edição dos dados gerais", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: rawEdital });

    await atualizarEditalAdmin("edital-1", {
      nome: "Concurso exemplo",
      orgao: "Órgão exemplo",
      banca: "Banca",
      url_oficial: "https://example.test/novo",
    });

    expect(api.put).toHaveBeenCalledWith("/admin/editais/edital-1", {
      nome: "Concurso exemplo",
      orgao: "Órgão exemplo",
      banca: "Banca",
      url_oficial: "https://example.test/novo",
    });
    expect(vi.mocked(api.put).mock.calls[0]?.[1]).not.toHaveProperty("edital_url");
  });

  it("usa url_oficial no multipart de criação e a rota dedicada na remoção", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: rawEdital });
    vi.mocked(api.delete).mockResolvedValue({ data: { ...rawEdital, edital_url: null } });

    await criarEditalAdmin({
      nome: "Concurso exemplo",
      orgao: "Órgão exemplo",
      cargo_nome: "Analista",
      banca: "Banca",
      url_oficial: "https://example.test/concurso",
      arquivo: null,
      logo: null,
    });
    await removerEditalAdmin("edital-1");

    const form = vi.mocked(api.post).mock.calls[0]?.[1] as FormData;
    expect(form.get("url_oficial")).toBe("https://example.test/concurso");
    expect(form.get("edital_url")).toBeNull();
    expect(api.delete).toHaveBeenCalledWith("/admin/editais/edital-1/edital");
  });
});
