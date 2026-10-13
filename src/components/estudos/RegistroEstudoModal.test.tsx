import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("@/services/categorias", () => ({
  listCategorias: vi.fn(async () => [{ id: "categoria-1", nome: "Teoria" }]),
  createCategoria: vi.fn(),
}));
vi.mock("@/services/revisoesConfig", () => ({
  getRevisoesConfig: vi.fn(async () => ({ dias: [1, 7, 30] })),
}));
vi.mock("@/stores/concursoStore", () => ({ useConcursoAtivoId: () => "concurso-1" }));

describe("RegistroEstudoModal", () => {
  it("registra tempo real e conclusão explícita na atividade e data escolhidas", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><RegistroEstudoModal open onClose={vi.fn()} defaultConcursoId="concurso-1" defaultDisciplinaId="disciplina-1" defaultBlocoId="bloco-1" defaultDataReferencia="2026-10-09" defaultDuracaoSegundos={1500} /></QueryClientProvider>);
    await userEvent.click(await screen.findByRole("checkbox", { name: /Concluir atividade desta ocorrência/ }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/sessoes-estudo", expect.objectContaining({ concurso_id: "concurso-1", bloco_cronograma_id: "bloco-1", cronograma_item_id: null, atividade_concluida: true, data_referencia: "2026-10-09", tempo_estudo_segundos: 1500 })));
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/disciplinas") return { data: [{ id: "disciplina-1", nome: "Direito" }] } as never;
      if (url === "/disciplinas/disciplina-1/topicos") {
        return { data: [{ id: "topico-1", descricao: "Constituição", status: "nao_iniciado" }] } as never;
      }
      return { data: [] } as never;
    });
  });

  it("mantém o tópico contextual selecionado ao hidratar a disciplina padrão", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <RegistroEstudoModal
          open
          onClose={vi.fn()}
          defaultConcursoId="concurso-1"
          defaultDisciplinaId="disciplina-1"
          defaultTopicos={[{ id: "topico-1", nome: "Constituição" }]}
          defaultDuracaoSegundos={1500}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("1 selecionado(s)")).toBeInTheDocument();
    expect(await screen.findByRole("checkbox", { name: "Selecionar tópico Constituição" })).toBeChecked();
  });
});
