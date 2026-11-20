import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DisciplinaEditor } from "@/pages/DisciplinaEditor";
import { useConcursoStore } from "@/stores/concursoStore";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

function Destination() {
  return <p>{useLocation().search}</p>;
}

function setup(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/disciplinas/nova" element={<DisciplinaEditor />} />
      <Route path="/disciplinas/:disciplinaId/editar" element={<DisciplinaEditor />} />
      <Route path="/disciplinas" element={<Destination />} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

describe("Cadastro manual de disciplinas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConcursoStore.getState().resolveConcursoContext("concurso-1");
    vi.mocked(api.get).mockImplementation(async (url) => ({ data: url === "/concursos"
      ? [{ id: "concurso-1", nome: "Edital", orgao: "Órgão", cargo: "Analista" }]
      : { id: "disciplina-1", nome: "Direito", sigla: "DIR", concurso_ids: ["concurso-1"], topicos_total: 15 } }));
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
  });

  it("preenche o concurso, bloqueia duplicados e envia tópicos na ordem revisada", async () => {
    setup("/disciplinas/nova?view=edital");
    expect(await screen.findByRole("checkbox", { name: "Órgão — Analista" })).toBeChecked();
    fireEvent.change(screen.getByRole("textbox", { name: "Nome da disciplina" }), { target: { value: "Direito" } });
    const editor = screen.getByRole("textbox", { name: "Novos tópicos" });
    fireEvent.change(editor, { target: { value: "Conceitos\n\nPrincípios\nconceitos" } });
    expect(screen.getByRole("button", { name: "Salvar disciplina" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Remover tópico 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Subir tópico 2" }));
    expect(editor).toHaveValue("Princípios\nConceitos");
    fireEvent.click(screen.getByRole("button", { name: "Salvar disciplina" }));
    expect(await screen.findByText("?view=edital")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/disciplinas", {
      nome: "Direito", sigla: null, concurso_ids: ["concurso-1"], novos_topicos: ["Princípios", "Conceitos"],
    });
  });

  it("na edição envia apenas tópicos novos e mantém vínculos e filtros", async () => {
    setup("/disciplinas/disciplina-1/editar?busca=Direito");
    expect(await screen.findByRole("heading", { name: "Editar disciplina" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gerenciar tópicos cadastrados" })).toHaveAttribute("href", "/disciplinas/disciplina-1");
    fireEvent.change(screen.getByRole("textbox", { name: "Novos tópicos" }), { target: { value: "Novo tópico" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar disciplina" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledExactlyOnceWith("/disciplinas/disciplina-1", {
      nome: "Direito", sigla: "DIR", novos_topicos: ["Novo tópico"],
    }));
    expect(await screen.findByText("?busca=Direito")).toBeInTheDocument();
  });

  it("pagina 120 tópicos e protege o rascunho ao cancelar", async () => {
    setup("/disciplinas/nova");
    const editor = await screen.findByRole("textbox", { name: "Novos tópicos" });
    const text = Array.from({ length: 120 }, (_, index) => `Assunto ${index + 1}`).join("\n");
    fireEvent.change(editor, { target: { value: text } });
    expect(screen.getAllByRole("listitem")).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("Assunto 31")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("alertdialog", { name: "Descartar alterações?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(editor).toHaveValue(text);
    expect(api.post).not.toHaveBeenCalled();
  });
});
