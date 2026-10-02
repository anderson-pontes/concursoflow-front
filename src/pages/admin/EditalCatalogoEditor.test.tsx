import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditalCatalogoEditor } from "@/pages/admin/EditalCatalogoEditor";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

const services = vi.hoisted(() => ({
  atualizarEditalAdmin: vi.fn(),
  criarVersaoRascunho: vi.fn(),
  obterEditalAdmin: vi.fn(),
  publicarVersao: vi.fn(),
  removerEditalAdmin: vi.fn(),
  salvarEstruturaVersao: vi.fn(),
  uploadEditalAdmin: vi.fn(),
  uploadLogoAdmin: vi.fn(),
}));

vi.mock("@/services/editaisCatalogo", () => services);
vi.mock("@/components/admin/editais/EditalClassificationSection", () => ({ EditalClassificationSection: () => null }));
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
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/editais/:id/editar" element={<EditalCatalogoEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Editor administrativo de edital", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    services.obterEditalAdmin.mockResolvedValue(edital);
    services.atualizarEditalAdmin.mockResolvedValue(edital);
    services.removerEditalAdmin.mockResolvedValue({ ...edital, edital_url: null });
    services.salvarEstruturaVersao.mockResolvedValue(edital.versoes?.[0]);
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
