import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditalCatalogoEditor } from "@/pages/admin/EditalCatalogoEditor";
import { toast } from "sonner";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

const services = vi.hoisted(() => ({
  atualizarEditalAdmin: vi.fn(),
  criarVersaoRascunho: vi.fn(),
  obterEditalAdmin: vi.fn(),
  publicarVersao: vi.fn(),
  removerEditalAdmin: vi.fn(),
  salvarEstruturaVersao: vi.fn(),
  salvarCronogramaVersao: vi.fn(),
  salvarClassificacaoVersao: vi.fn(),
  listarClassificacoesAdmin: vi.fn(),
  uploadEditalAdmin: vi.fn(),
  uploadLogoAdmin: vi.fn(),
}));

vi.mock("@/services/editaisCatalogo", () => services);
vi.mock("@/components/admin/editais/EditalImportDialog", () => ({ EditalImportDialog: () => null }));
vi.mock("@/components/concursos/FileDropZone", () => ({
  FileDropZone: ({ id, label, onFileChange }: { id: string; label: string; onFileChange: (file: File | null) => void }) => (
    <label>{label}<input aria-label={label} id={id} type="file" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} /></label>
  ),
}));
vi.mock("@/components/editais/CatalogLogo", () => ({ CatalogLogo: () => <div data-testid="catalog-logo" /> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const edital: EditalCatalogo = {
  id: "edital-1",
  nome: "Concurso exemplo",
  orgao: "Órgão exemplo",
  banca: "Banca",
  url_oficial: null,
  edital_url: null,
  logo_url: null,
  status: "rascunho",
  versao_atual: null,
  versoes: [
    {
      id: "versao-1",
      numero: "1",
      status: "rascunho",
      publicada_em: null,
      classificacao: {
        esfera: null,
        areas: [],
        ano_edital: 2026,
        revision: 0,
        fonte_tipo: null,
        fonte_ref: null,
        updated_at: null,
      },
      cargos: [
        {
          id: "cargo-1",
          nome: "Analista",
          ordem: 1,
          disciplinas: [
            {
              id: "disciplina-1",
              nome: "Português",
              sigla: null,
              ordem: 1,
              topicos: [{ id: "topico-1", descricao: "Interpretação de textos", ordem: 1, peso: 1 }],
            },
          ],
        },
      ],
    },
  ],
};

function renderEditor(path = "/admin/editais/edital-1/editar?tab=conteudo") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/editais/:id/editar" element={<EditalCatalogoEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe("Editor administrativo de edital", () => {
  it("salva somente o cronograma publicado com confirmação e sem alterar conteúdo", async () => {
    const user = userEvent.setup();
    const version = { ...edital.versoes![0], status: "publicado" as const, data_prova: "2026-12-01" };
    const published = { ...edital, status: "publicado" as const, versao_atual: version, versoes: [version] };
    services.obterEditalAdmin.mockResolvedValue(published);
    services.salvarCronogramaVersao.mockResolvedValue({ ...version, data_prova: null });
    renderEditor("/admin/editais/edital-1/editar?tab=geral");
    await user.click(await screen.findByRole("button", { name: "Limpar data da prova" }));
    await user.click(screen.getByRole("button", { name: "Salvar cronograma" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(/avisos manuais não serão alterados/i);
    services.obterEditalAdmin.mockResolvedValue({ ...published, versao_atual: { ...version, data_prova: null }, versoes: [{ ...version, data_prova: null }] });
    await user.click(within(dialog).getByRole("button", { name: "Salvar cronograma" }));
    await waitFor(() => expect(services.salvarCronogramaVersao).toHaveBeenCalledWith("edital-1", "versao-1", { inicio_inscricoes: null, encerramento_inscricoes: null, limite_pagamento: null, data_prova: null }));
    expect(services.salvarEstruturaVersao).not.toHaveBeenCalled();
    expect(services.atualizarEditalAdmin).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Data da prova" })).toHaveTextContent("Selecione uma data"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    services.obterEditalAdmin.mockResolvedValue(edital);
    services.atualizarEditalAdmin.mockResolvedValue(edital);
    services.removerEditalAdmin.mockResolvedValue({ ...edital, edital_url: null });
    services.salvarEstruturaVersao.mockResolvedValue(edital.versoes?.[0]);
    services.listarClassificacoesAdmin.mockResolvedValue([]);
    services.salvarClassificacaoVersao.mockResolvedValue(undefined);
  });

  it("salva a classificação pelo botão principal e preserva a edição ao trocar de aba", async () => {
    const user = userEvent.setup();
    renderEditor("/admin/editais/edital-1/editar?tab=geral");
    const year = await screen.findByLabelText("Ano do edital");
    expect(screen.queryByRole("button", { name: /salvar classificação/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /salvar rascunho/i })).toHaveLength(1);
    await user.clear(year);
    await user.type(year, "2027");
    await user.type(screen.getByLabelText(/referência da fonte/i), "Edital oficial nº 01/2027");
    await user.click(screen.getByRole("button", { name: "Disciplinas e conteúdo" }));
    await user.click(screen.getByRole("button", { name: "Informações gerais" }));
    expect(screen.getByLabelText("Ano do edital")).toHaveValue(2027);
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(services.salvarClassificacaoVersao).toHaveBeenCalledWith("edital-1", "versao-1", {
      esfera_chave: null, area_chaves: [], ano_edital: 2027,
      fonte_tipo: "manual_validado", fonte_ref: "Edital oficial nº 01/2027", expected_revision: 0,
    }));
  }, 10_000);

  it("valida a classificação antes de enviar qualquer alteração do rascunho", async () => {
    const user = userEvent.setup();
    renderEditor("/admin/editais/edital-1/editar?tab=geral");
    const year = await screen.findByLabelText("Ano do edital");
    await user.clear(year);
    await user.type(year, "1800");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /salvar rascunho/i })).toBeEnabled());
    expect(services.atualizarEditalAdmin).not.toHaveBeenCalled();
    expect(services.salvarEstruturaVersao).not.toHaveBeenCalled();
    expect(services.salvarClassificacaoVersao).not.toHaveBeenCalled();
  });

  it("atualiza a classificação salva quando o cache recebe uma revisão mais recente", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderEditor("/admin/editais/edital-1/editar?tab=geral");
    await user.type(await screen.findByLabelText(/referência da fonte/i), "Referência inicial");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(services.salvarClassificacaoVersao).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: /salvar rascunho/i })).toBeEnabled());
    const current = {
      ...edital,
      versoes: [{ ...edital.versoes![0], classificacao: {
        ...edital.versoes![0].classificacao,
        fonte_tipo: "manual_validado", fonte_ref: "Referência recarregada", revision: 2,
      } }],
    };
    services.obterEditalAdmin.mockResolvedValue(current);
    await act(async () => { queryClient.setQueryData(["admin-edital", "edital-1"], current); });
    await waitFor(() => expect(screen.getByLabelText(/referência da fonte/i)).toHaveValue("Referência recarregada"));
    await user.type(screen.getByLabelText(/referência da fonte/i), " revisada");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(services.salvarClassificacaoVersao).toHaveBeenLastCalledWith(
      "edital-1", "versao-1", expect.objectContaining({ expected_revision: 2, fonte_ref: "Referência recarregada revisada" }),
    ));
  });

  it("preserva a classificação não salva durante a revalidação do cache", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderEditor("/admin/editais/edital-1/editar?tab=geral");
    await user.type(await screen.findByLabelText(/referência da fonte/i), "Edição em andamento");
    await act(async () => {
      queryClient.setQueryData(["admin-edital", "edital-1"], {
        ...edital, versoes: [{ ...edital.versoes![0], classificacao: {
          ...edital.versoes![0].classificacao, fonte_ref: "Valor do servidor", revision: 2,
        } }],
      });
    });
    expect(screen.getByLabelText(/referência da fonte/i)).toHaveValue("Edição em andamento");
  });

  it("não publica nem informa sucesso quando a classificação falha, permitindo tentar novamente", async () => {
    const user = userEvent.setup();
    services.salvarClassificacaoVersao.mockRejectedValueOnce(new Error("Conflito de classificação"));
    services.publicarVersao.mockResolvedValue(edital.versoes?.[0]);
    renderEditor("/admin/editais/edital-1/editar?tab=geral");
    await user.type(await screen.findByLabelText(/referência da fonte/i), "Edital oficial");
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(screen.getByRole("button", { name: "Salvar e publicar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Conflito de classificação"));
    expect(services.publicarVersao).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(screen.getByRole("button", { name: "Salvar e publicar" }));
    await waitFor(() => expect(services.publicarVersao).toHaveBeenCalledTimes(1));
    expect(services.salvarClassificacaoVersao).toHaveBeenCalledTimes(2);
  });

  it("salva a classificação antes de publicar e não repete a gravação após falha da publicação", async () => {
    const user = userEvent.setup();
    services.publicarVersao.mockRejectedValueOnce(new Error("Falha temporária"));
    services.publicarVersao.mockResolvedValue(edital.versoes?.[0]);
    renderEditor("/admin/editais/edital-1/editar?tab=geral");
    await user.type(await screen.findByLabelText(/referência da fonte/i), "Edital 01/2026");
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(screen.getByRole("button", { name: "Salvar e publicar" }));
    await waitFor(() => expect(services.publicarVersao).toHaveBeenCalledTimes(1));
    expect(services.salvarClassificacaoVersao).toHaveBeenCalledTimes(1);
    expect(services.salvarClassificacaoVersao.mock.invocationCallOrder[0]).toBeLessThan(services.publicarVersao.mock.invocationCallOrder[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(screen.getByRole("button", { name: "Salvar e publicar" }));
    await waitFor(() => expect(services.publicarVersao).toHaveBeenCalledTimes(2));
    expect(services.salvarClassificacaoVersao).toHaveBeenCalledTimes(1);
  });

  it("inclui, edita, reordena e persiste disciplinas e tópicos inline e em lote", async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(await screen.findByRole("heading", { name: "Concurso exemplo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /adicionar disciplina/i }));
    const disciplineInput = screen.getByPlaceholderText("Ex.: Direito Administrativo");
    await user.type(disciplineInput, "Banco de Dados{Enter}");

    const disciplineHeading = await screen.findByText("Banco de Dados");
    const disciplineCard = disciplineHeading.closest("article");
    expect(disciplineCard).not.toBeNull();
    const card = within(disciplineCard as HTMLElement);

    const quickTopic = card.getByPlaceholderText("Digite o conteúdo e pressione Enter");
    await user.type(quickTopic, "SQL{Enter}");
    expect(card.getByDisplayValue("SQL")).toBeInTheDocument();

    await user.click(card.getByRole("button", { name: /adicionar conteúdo em lote/i }));
    await user.type(card.getByRole("textbox", { name: /cole um tópico por linha/i }), "1 Modelagem de dados{Enter}1.1 Normalização");
    await user.click(card.getByRole("button", { name: /revisar tópicos/i }));
    expect(card.getByText("2 tópicos identificados")).toBeInTheDocument();
    await user.click(card.getByRole("button", { name: /confirmar 2 tópicos/i }));

    await user.click(screen.getByRole("button", { name: /editar nome de banco de dados/i }));
    const nameInput = screen.getByDisplayValue("Banco de Dados");
    await user.clear(nameInput);
    await user.type(nameInput, "Banco de Dados e SQL");
    await user.click(card.getByRole("button", { name: /concluir/i }));

    await user.click(card.getByRole("button", { name: /mover tópico 3 para cima/i }));
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));

    await waitFor(() => expect(services.salvarEstruturaVersao).toHaveBeenCalledTimes(1));
    const [, , cargos] = services.salvarEstruturaVersao.mock.calls[0];
    const savedDiscipline = cargos[0].disciplinas.find((item: { nome: string }) => item.nome === "Banco de Dados e SQL");
    expect(savedDiscipline.topicos.map((item: { descricao: string }) => item.descricao)).toEqual(["SQL", "Normalização", "Modelagem de dados"]);
    expect(savedDiscipline.topicos.map((item: { ordem: number }) => item.ordem)).toEqual([1, 2, 3]);
  }, 10_000);

  it("confirma a remoção sem usar confirmação nativa", async () => {
    const user = userEvent.setup();
    renderEditor();

    await screen.findByRole("heading", { name: "Concurso exemplo" });
    await user.click(screen.getByRole("button", { name: /remover português/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover disciplina" }));

    await waitFor(() => expect(screen.queryByText("Português")).not.toBeInTheDocument());
  });

  it("busca disciplinas e tópicos sem perder a edição ao limpar o filtro", async () => {
    const user = userEvent.setup();
    renderEditor();
    const topic = await screen.findByRole("textbox", { name: "Tópico 1" });
    expect(topic.tagName).toBe("TEXTAREA");
    await user.clear(topic);
    await user.type(topic, "Interpretação de textos e compreensão de\ntextos longos");
    const search = screen.getByRole("textbox", { name: "Buscar disciplinas ou tópicos" });
    await user.type(search, "compreensao");
    expect(screen.getByText("1 de 1 disciplinas encontradas")).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "disciplina inexistente");
    expect(screen.getByText("Nenhuma disciplina ou tópico encontrado.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Tópico 1" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByRole("textbox", { name: "Tópico 1" })).toHaveValue("Interpretação de textos e compreensão de\ntextos longos");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(services.salvarEstruturaVersao).toHaveBeenCalledWith(
      "edital-1", "versao-1", expect.arrayContaining([expect.objectContaining({ disciplinas: expect.arrayContaining([
        expect.objectContaining({ topicos: expect.arrayContaining([expect.objectContaining({ descricao: "Interpretação de textos e compreensão de\ntextos longos" })]) }),
      ]) })]),
    ));
  });

  it("recolhe e expande disciplinas preservando campos e valores", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByRole("textbox", { name: "Tópico 1" });
    await user.type(screen.getByPlaceholderText("Digite o conteúdo e pressione Enter"), "Novo tópico pendente");
    await user.click(screen.getByRole("button", { name: "Recolher todas" }));
    expect(screen.queryByRole("textbox", { name: "Tópico 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Português.*tópicos/i })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Expandir todas" }));
    expect(screen.getByRole("textbox", { name: "Tópico 1" })).toHaveValue("Interpretação de textos");
    expect(screen.getByPlaceholderText("Digite o conteúdo e pressione Enter")).toHaveValue("Novo tópico pendente");
  });

  it("bloqueia formulários de disciplina já abertos durante o salvamento", async () => {
    const user = userEvent.setup();
    let finishSave!: (value: unknown) => void;
    services.salvarEstruturaVersao.mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve; }));
    renderEditor();
    await screen.findByRole("textbox", { name: "Tópico 1" });
    await user.click(screen.getByRole("button", { name: "Editar nome de Português" }));
    await user.click(screen.getByRole("button", { name: "Adicionar disciplina" }));
    const disciplineInput = screen.getByRole("combobox");
    await user.type(disciplineInput, "Direito");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(services.salvarEstruturaVersao).toHaveBeenCalled());
    expect(disciplineInput).toBeDisabled();
    expect(screen.getByLabelText("Nome", { exact: true })).toBeDisabled();
    expect(screen.getByLabelText("Sigla")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
    await act(async () => { finishSave(edital.versoes![0]); });
    await waitFor(() => expect(disciplineInput).toBeEnabled());
  });

  it("seleciona outro cargo após remover o cargo ativo", async () => {
    const user = userEvent.setup();
    services.obterEditalAdmin.mockResolvedValue({ ...edital, versoes: [{ ...edital.versoes![0], cargos: [
      edital.versoes![0].cargos[0],
      { ...edital.versoes![0].cargos[0], id: "cargo-2", nome: "Técnico", ordem: 2, disciplinas: [] },
    ] }] });
    renderEditor();
    await screen.findByDisplayValue("Analista");
    expect(screen.getByRole("navigation", { name: "Cargos do concurso" }).parentElement).toHaveClass("grid-cols-1");
    await user.click(screen.getByRole("button", { name: "Remover cargo" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remover cargo" }));
    expect(await screen.findByDisplayValue("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma disciplina adicionada")).toBeInTheDocument();
  });

  it("preenche e persiste a URL oficial nos dados gerais", async () => {
    const user = userEvent.setup();
    services.obterEditalAdmin.mockResolvedValue({ ...edital, url_oficial: "https://example.test/antiga" });
    renderEditor("/admin/editais/edital-1/editar?tab=geral");

    const input = await screen.findByDisplayValue("https://example.test/antiga");
    await user.clear(input);
    await user.type(input, "https://example.test/nova");
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }));

    await waitFor(() => expect(services.atualizarEditalAdmin).toHaveBeenCalledWith(
      "edital-1",
      expect.objectContaining({ url_oficial: "https://example.test/nova" }),
    ));
  });

  it("carrega URL oficial e remove o edital associado sem recarregar a página", async () => {
    const user = userEvent.setup();
    const withDocument = {
      ...edital,
      url_oficial: "https://example.test/concurso",
      edital_url: "/uploads/editais-catalogo/edital-1/edital%2001.pdf",
    };
    services.obterEditalAdmin
      .mockResolvedValueOnce(withDocument)
      .mockResolvedValue({ ...withDocument, edital_url: null });
    services.removerEditalAdmin.mockResolvedValue({ ...withDocument, edital_url: null, versoes: [], versao_atual: null });
    renderEditor("/admin/editais/edital-1/editar?tab=geral");

    expect(await screen.findByDisplayValue("https://example.test/concurso")).toBeInTheDocument();
    expect(screen.getByText("edital 01.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir \/ visualizar/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/uploads/editais-catalogo/edital-1/edital%2001.pdf"),
    );

    await user.click(screen.getByRole("button", { name: "Remover edital" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover edital" }));

    await waitFor(() => expect(services.removerEditalAdmin).toHaveBeenCalledWith("edital-1"));
    expect(await screen.findByText("Nenhum edital cadastrado para este concurso.")).toBeInTheDocument();
  });

  it("cadastra um edital ausente e exibe o documento imediatamente", async () => {
    const user = userEvent.setup();
    const withDocument = {
      ...edital,
      edital_url: "/uploads/editais-catalogo/edital-1/novo-edital.pdf",
      versoes: [],
      versao_atual: null,
    };
    services.uploadEditalAdmin.mockResolvedValue(withDocument);
    services.obterEditalAdmin
      .mockResolvedValueOnce(edital)
      .mockResolvedValue({ ...edital, edital_url: withDocument.edital_url });
    renderEditor("/admin/editais/edital-1/editar?tab=geral");

    await screen.findByText("Nenhum edital cadastrado para este concurso.");
    const document = new File(["edital"], "novo-edital.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Cadastrar novo edital"), document);
    await user.click(screen.getByRole("button", { name: "Cadastrar edital" }));

    await waitFor(() => expect(services.uploadEditalAdmin).toHaveBeenCalledWith("edital-1", document));
    expect(await screen.findByText("novo-edital.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum edital cadastrado para este concurso.")).not.toBeInTheDocument();
  });

  it("bloqueia salvar e publicar enquanto o upload do edital está em andamento", async () => {
    const user = userEvent.setup();
    let finishUpload!: (value: EditalCatalogo) => void;
    services.uploadEditalAdmin.mockImplementation(() => new Promise<EditalCatalogo>((resolve) => {
      finishUpload = resolve;
    }));
    renderEditor("/admin/editais/edital-1/editar?tab=geral");

    await screen.findByText("Nenhum edital cadastrado para este concurso.");
    const document = new File(["edital"], "novo-edital.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Cadastrar novo edital"), document);
    await user.click(screen.getByRole("button", { name: "Cadastrar edital" }));

    expect(screen.getByRole("button", { name: /salvar rascunho/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    finishUpload({ ...edital, edital_url: "/uploads/editais-catalogo/edital-1/novo-edital.pdf" });
    await waitFor(() => expect(screen.getByRole("button", { name: /salvar rascunho/i })).toBeEnabled());
  });
});
