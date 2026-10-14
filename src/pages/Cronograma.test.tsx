import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cronograma } from "@/pages/Cronograma";
import { api } from "@/services/api";
import type { Planejamento, PlanejamentoResumo } from "@/lib/cronograma/types";

vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() } }));
vi.mock("@/stores/concursoStore", () => ({ useConcursoAtivoId: () => "concurso-1", useConcursoContextResolved: () => true, useConcursoContextError: () => false }));
vi.mock("@/components/cronograma/GerarCronogramaAutoModal", () => ({ GerarCronogramaAutoModal: () => null }));
vi.mock("@/components/estudos/RegistroEstudoModal", () => ({ RegistroEstudoModal: () => null }));
vi.mock("@/components/calendario/CalendarioDiaDetalheDialog", () => ({ CalendarioDiaDetalheDialog: () => null }));
const disciplinas = ["Direito", "Português", "Informática", "Matemática"].map((nome, index) => ({ id: `d-${index}`, nome, concurso_ids: ["concurso-1"] }));
const emptyPlan = (): Planejamento => ({ id: "plano-1", user_id: "user-1", concurso_id: "concurso-1", nome: "Meu plano", tipo: "manual", data_inicio: "2026-10-09", data_fim: null, dias_disponiveis: ["seg", "qua"], cargo: null, ativo: true, disciplinas: [] });
const summary: PlanejamentoResumo = { minutos_planejados_semana: 180, minutos_estudados_semana: 0, disciplinas_count: 3, atividades_planejadas: 3, atividades_concluidas: 0, progresso_pct: 0, disciplinas: [], questoes_total: 0, acertos: 0, erros: 0, rendimento_pct: 0 };
let plan: Planejamento | null;
let client: QueryClient;
function setup() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><Cronograma /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  plan = null;
  vi.mocked(api.get).mockImplementation(async url => {
    if (url === "/cronograma/planejamento") return { data: plan } as never;
    if (url === "/disciplinas") return { data: disciplinas } as never;
    if (url === "/concursos") return { data: [{ id: "concurso-1", nome: "Concurso teste" }] } as never;
    if (url.endsWith("/resumo")) return { data: summary } as never;
    return { data: [] } as never;
  });
  vi.mocked(api.post).mockImplementation(async (url, body) => {
    if (url === "/cronograma/planejamento") { plan = { ...emptyPlan(), ...(body as object) }; return { data: plan } as never; }
    if (url === "/cronograma/planejamento/plano-1/disciplinas") {
      const ids = (body as { disciplina_ids: string[] }).disciplina_ids;
      plan = { ...plan!, disciplinas: [...plan!.disciplinas, ...ids.map((id, ordem) => ({ disciplina_id: id, nome: disciplinas.find(d => d.id === id)!.nome, ordem }))] };
      return { data: plan } as never;
    }
    return { data: {} } as never;
  });
});

describe("gerenciamento incremental do cronograma", () => {
  it("keeps a missing API route distinct from a successful empty plan", async () => {
    const { AxiosError } = await import("axios");
    vi.mocked(api.get).mockImplementation(async url => {
      if (url === "/cronograma/planejamento") throw new AxiosError("Not Found", undefined, undefined, undefined,
        { status: 404, statusText: "Not Found", data: {}, headers: {}, config: {} as never });
      return { data: [] } as never;
    });
    const rendered = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Recurso indisponível na API");
    expect(screen.queryByRole("button", { name: "Criar cronograma" })).not.toBeInTheDocument();
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === "/cronograma/planejamento")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === "/cronograma/planejamento")).toHaveLength(2));
    rendered.unmount();
    client.clear();
  });
  it("cria uma vez, inclui três disciplinas e conserva o ID após nova inclusão e remontagem", async () => {
    const user = userEvent.setup();
    const rendered = setup();
    await user.click((await screen.findAllByRole("button", { name: "Criar cronograma" }))[0]);
    await user.click(screen.getByRole("button", { name: /Manual: cria/ }));
    const dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Nome do cronograma"));
    await user.type(within(dialog).getByLabelText("Nome do cronograma"), "Meu plano");
    await user.click(within(dialog).getByRole("button", { name: "Criar cronograma manual" }));
    expect(await screen.findByText("Seu cronograma está pronto!")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Adicionar disciplinas" })[0]);
    for (const name of ["Direito", "Português", "Informática"]) await user.click(screen.getByRole("checkbox", { name }));
    await user.click(screen.getByRole("button", { name: "Adicionar 3 disciplinas" }));
    await waitFor(() => expect(plan?.disciplinas).toHaveLength(3));
    await user.click(screen.getByRole("button", { name: "Adicionar disciplinas" }));
    expect(screen.getByRole("checkbox", { name: /Direito/ })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Buscar disciplinas" }), "Matem");
    await user.click(screen.getByRole("checkbox", { name: "Matemática" }));
    await user.click(screen.getByRole("button", { name: "Adicionar 1 disciplina" }));
    await waitFor(() => expect(plan?.disciplinas).toHaveLength(4));
    expect(vi.mocked(api.post).mock.calls.filter(([url]) => url === "/cronograma/planejamento")).toHaveLength(1);
    expect(plan?.id).toBe("plano-1");
    rendered.unmount();
    setup();
    expect(await screen.findByText("Meu plano")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Disciplinas" }));
    expect(await screen.findByRole("link", { name: "Matemática" })).toBeInTheDocument();
  }, 15000);

  it("mostra planejado separado de realizado e não recria o assistente ao adicionar", async () => {
    plan = { ...emptyPlan(), disciplinas: disciplinas.slice(0, 3).map((d, ordem) => ({ disciplina_id: d.id, nome: d.nome, ordem })) };
    setup();
    expect(await screen.findByText("3h")).toBeInTheDocument();
    const studied = screen.getByText("Horas estudadas na semana").parentElement!;
    expect(within(studied).getByText("0 min")).toBeInTheDocument();
    const progress = screen.getByText("Progresso das atividades").parentElement!;
    expect(within(progress).getByText("0%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Adicionar disciplinas" }));
    expect(screen.getByRole("dialog", { name: "Adicionar disciplinas ao cronograma" })).toBeInTheDocument();
    expect(screen.queryByText("Como deseja criar?")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome do cronograma")).not.toBeInTheDocument();
    expect(client.getQueryData(["cronograma-planejamento", "concurso-1"])).toMatchObject({ id: "plano-1" });
  });
});
