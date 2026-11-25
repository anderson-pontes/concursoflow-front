import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { fmtDateValue } from "@/components/estudos/registroEstudoSupport";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
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

  it.each([{ defaultCronogramaItemId: "item-1" }, { defaultBlocoId: "bloco-1" }])(
    "registra hoje sem concluir uma ocorrência marcada para outro dia",
    async (activity) => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(<QueryClientProvider client={client}><RegistroEstudoModal open onClose={vi.fn()}
        defaultConcursoId="concurso-1" defaultDisciplinaId="disciplina-1"
        defaultDataReferencia={fmtDateValue("hoje", "", tomorrow)} {...activity} /></QueryClientProvider>);
      await userEvent.click(await screen.findByRole("checkbox", { name: /Concluir atividade desta ocorrência/ }));
      await userEvent.click(screen.getByRole("button", { name: "Hoje" }));
      expect(screen.getByText(/A ocorrência original ficará no cronograma/)).toBeInTheDocument();
      expect(screen.queryByRole("checkbox", { name: /Concluir atividade desta ocorrência/ })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));
      await waitFor(() => expect(api.post).toHaveBeenCalledWith("/sessoes-estudo", expect.objectContaining({
        concurso_id: "concurso-1", data_referencia: fmtDateValue("hoje", "", now),
        bloco_cronograma_id: null, cronograma_item_id: null, atividade_concluida: false,
      })));
    },
  );

  it("calcula hoje e ontem no calendário local durante a noite", () => {
    const now = new Date(2026, 10, 24, 23, 30);
    expect(fmtDateValue("hoje", "", now)).toBe("2026-11-24");
    expect(fmtDateValue("ontem", "", now)).toBe("2026-11-23");
  });

  it("exibe o motivo devolvido pela API e mantém o formulário aberto", async () => {
    const detail = "A data da sessão não corresponde à ocorrência planejada";
    vi.mocked(api.post).mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: { detail } } });
    const onClose = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><RegistroEstudoModal open onClose={onClose} defaultDisciplinaId="disciplina-1" /></QueryClientProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(detail));
    expect(onClose).not.toHaveBeenCalled();
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
