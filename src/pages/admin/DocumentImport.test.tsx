import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentImport } from "@/pages/admin/DocumentImport";
import * as service from "@/services/documentImport";
import type { ImportSession } from "@/services/documentImport";

vi.mock("@/services/documentImport");
const example: ImportSession = { id: "session-1", document_key: "TESTE-001", status: "validado", revision: 1, metadata_json: {}, summary: { cargos: 2, disciplinas: 1, relacoes: 2, topicos: 3, anexos: 0, eventos: 1, erros: 0 }, report: null, edital_id: null, version_id: null, created_at: "2026-10-25T12:00:00Z" };
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><DocumentImport /></MemoryRouter></QueryClientProvider>);
}
async function reopen() {
  await userEvent.click(await screen.findByRole("button", { name: "Abrir importação" }));
  await screen.findByRole("heading", { name: "Inspecione os dados por seção" });
}
describe("DocumentImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(service.getImportContract).mockResolvedValue({ version: "CLICKEDITAL-IMPORT-V1", sections: { "02": { title: "Dados gerais", headers: ["campo", "valor"] }, "08": { title: "Tópicos", headers: ["codigo", "titulo"] } } });
    vi.mocked(service.getImportHistory).mockResolvedValue({ items: [example], total: 1, page: 1, page_size: 10 });
    vi.mocked(service.getImportSession).mockResolvedValue(example);
    vi.mocked(service.getImportRows).mockResolvedValue({ items: [{ id: "row-1", section: "02", line: 2, data: { campo: "nome", valor: "Concurso inicial" }, issues: [] }], total: 1, page: 1, page_size: 50 });
    vi.mocked(service.confirmImport).mockResolvedValue({ ...example, status: "aplicado", edital_id: "edital-1", report: { novos: 1 } });
    vi.mocked(service.uploadImport).mockResolvedValue(example);
    vi.mocked(service.correctImportField).mockResolvedValue({ ...example, status: "validando", revision: 2 });
    vi.mocked(service.validateImport).mockResolvedValue({ ...example, revision: 2 });
  });

  it("rejeita arquivo incompatível sem chamar upload", async () => {
    setup();
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(screen.getByLabelText("Arraste o documento ou selecione um arquivo"), new File(["texto"], "arquivo.txt", { type: "text/plain" }));
    expect(await screen.findByText("Envie um DOCX ou PDF não vazio de até 10 MB.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar e validar" })).toBeDisabled();
    expect(service.uploadImport).not.toHaveBeenCalled();
  });

  it("envia o documento e apresenta validação sem persistir catálogo", async () => {
    setup();
    const file = new File(["docx"], "concurso.docx");
    await userEvent.upload(screen.getByLabelText("Arraste o documento ou selecione um arquivo"), file);
    await userEvent.click(screen.getByRole("button", { name: "Enviar e validar" }));
    expect(await screen.findByRole("heading", { name: "Validação do documento" })).toBeInTheDocument();
    expect(service.uploadImport).toHaveBeenCalledWith(file, null);
    expect(service.confirmImport).not.toHaveBeenCalled();
  });

  it("exige confirmação explícita da revisão antes do cadastro", async () => {
    setup(); await reopen();
    await userEvent.click(screen.getByRole("button", { name: "Conferir plano de cadastro" }));
    const confirm = screen.getByRole("button", { name: "Confirmar cadastro" });
    expect(confirm).toBeDisabled();
    expect(service.confirmImport).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(confirm);
    await waitFor(() => expect(service.confirmImport).toHaveBeenCalledWith("session-1", 1));
    expect(await screen.findByRole("link", { name: "Conferir edital no editor" })).toHaveAttribute("href", "/admin/editais/edital-1/editar");
  });

  it("salva um campo e exige revalidação explícita das correções", async () => {
    setup(); await reopen();
    await userEvent.click(screen.getByRole("button", { name: "Abrir correções" }));
    await userEvent.click(await screen.findByRole("button", { name: "Corrigir valor na linha 2" }));
    const field = screen.getByRole("textbox", { name: "Corrigir valor na linha 2" });
    await userEvent.clear(field); await userEvent.type(field, "Nome corrigido");
    await userEvent.click(screen.getByRole("button", { name: "Salvar campo" }));
    await waitFor(() => expect(service.correctImportField).toHaveBeenCalledWith("session-1", "row-1", 1, "valor", "Nome corrigido"));
    expect(await screen.findByText(/Há correções ainda não validadas/)).toBeInTheDocument();
    expect(service.validateImport).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Validar correções" }));
    await waitFor(() => expect(service.validateImport).toHaveBeenCalledWith("session-1", 2));
  });

  it("mostra erros globais de campos ausentes na validação e nas correções", async () => {
    const invalid = { ...example, status: "invalido", summary: { ...example.summary, erros: 1 }, metadata_json: { issues: [{ section: "02", line: 1, field: "orgao", value: "", message: "Campo obrigatório ausente", expected: "Informe o órgão do concurso" }] } };
    vi.mocked(service.uploadImport).mockResolvedValue(invalid);
    vi.mocked(service.getImportSession).mockResolvedValue(invalid);
    setup();
    await userEvent.upload(screen.getByLabelText("Arraste o documento ou selecione um arquivo"), new File(["docx"], "concurso.docx"));
    await userEvent.click(screen.getByRole("button", { name: "Enviar e validar" }));
    expect(await screen.findByText("Seção 02 · Linha 1 · orgao")).toBeInTheDocument();
    expect(screen.getByText("Campo obrigatório ausente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Corrigir inconsistências" }));
    expect(screen.getByText("Seção 02 · Linha 1 · orgao")).toBeInTheDocument();
    expect(screen.getByText(/Campos obrigatórios ausentes precisam ser incluídos/)).toBeInTheDocument();
  });

  it("preserva identificadores fixos e documento_codigo na correção", async () => {
    vi.mocked(service.getImportRows).mockResolvedValue({ items: [{ id: "row-1", section: "01", line: 2, data: { campo: "documento_codigo", valor: "TESTE-001" }, issues: [] }, { id: "row-2", section: "02", line: 3, data: { campo: "nome", valor: "Concurso" }, issues: [] }], total: 2, page: 1, page_size: 50 });
    setup(); await reopen();
    await userEvent.click(screen.getByRole("button", { name: "Abrir correções" }));
    expect(await screen.findByText("TESTE-001", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corrigir campo na linha 2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corrigir valor na linha 2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corrigir campo na linha 3" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corrigir valor na linha 3" })).toBeEnabled();
  });
});
