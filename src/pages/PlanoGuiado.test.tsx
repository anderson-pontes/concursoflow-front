import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanoGuiado } from "@/pages/PlanoGuiado";
import { confirmarPlanoGuiado, previewPlanejamento } from "@/services/planejamento";
import { clearOnboardingDraft, readOnboardingDraft, type OnboardingDraft } from "@/lib/onboardingDraftStorage";
import type { PlanejamentoPreview, PlanoGuiadoResponse } from "@/types/planejamento";

const mocks = vi.hoisted(() => ({ transition: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/services/planejamento");
vi.mock("@/services/api", () => ({ api: { get: vi.fn().mockResolvedValue({ data: [] }) } }));
vi.mock("@/hooks/useConcursoContextTransition", () => ({ useConcursoContextTransition: () => mocks.transition }));
vi.mock("@/hooks/usePlanoCatalogo", () => ({ usePlanoCatalogo: () => ({ resumo: { data: undefined, isError: false }, conteudo: { data: undefined, isSuccess: false }, cargo: undefined, versao: undefined }) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (selector: (value: { user: { id: string } }) => unknown) => selector({ user: { id: "user-1" } }) }));
vi.mock("@/stores/concursoStore", () => ({ useConcursoStore: Object.assign((selector: (value: { concursoAtivoId: null }) => unknown) => selector({ concursoAtivoId: null }), { getState: () => ({ concursoAtivoId: null }) }) }));
vi.mock("@/lib/onboardingDraftStorage", () => ({ readOnboardingDraft: vi.fn(), saveOnboardingDraft: vi.fn(), clearOnboardingDraft: vi.fn() }));
vi.mock("@/services/telemetry", () => ({ createTelemetryJourney: () => ({ track: vi.fn() }), telemetryErrorCode: () => "server_error", trackCatalogItemForActivation: vi.fn(), trackTelemetry: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error, info: vi.fn(), warning: vi.fn() } }));

const draft: OnboardingDraft = {
  schemaVersion: 1, userScope: "user-1", updatedAt: "2026-11-03T12:00:00Z", idempotencyKey: "guided-test-1", step: 4,
  tipo: "personalizado", busca: "", editalId: null, versionId: null, cargoId: null,
  nome: "Concurso de auditor", orgao: "Órgão QA", cargoNome: "Analista", banca: "", dataProva: "2026-12-01", observacoes: "",
  disciplinas: [{ nome: "Português", topicos: ["Interpretação"], ativa: true, peso: 5, conhecimento: "regular", ordem: 0 }],
  config: { tipo: "semanal", disponibilidade_minutos: { 0: 180, 1: 0, 2: 120 }, sessao_min_minutos: 25, sessao_max_minutos: 50, data_inicio: "2026-11-09", data_fim: "2026-11-30" },
};
const preview: PlanejamentoPreview = {
  sessoes: [{ disciplina_id: null, disciplina_nome: "Português", data: "2026-11-09", dia_semana: 0, duracao_minutos: 45, ordem: 1 }],
  minutos_totais: 45, carga_semanal_minutos: 300, prioridades: { Português: 15 }, preview_fingerprint: "a".repeat(64),
  explicacao: { versao_contrato: 1, algoritmo_versao: "planejamento-v1", confirmavel: true, capacidade: { capacidade_informada_minutos: 45, capacidade_planejavel_minutos: 45, carga_alocada_minutos: 45, saldo_nao_planejavel_minutos: 0, dias_disponiveis: 1, dias_utilizados: 1, encaixe_calendario: "viavel", cobertura_edital: "indeterminada_sem_estimativa_esforco" }, disciplinas: [{ disciplina_id: null, disciplina_nome: "Português", peso: 5, conhecimento: "regular", fator_conhecimento: 3, prioridade: 15, minutos_alocados: 45, sessoes: 1, dias_utilizados: 1, participacao_bps: 10000 }], alertas: ["COBERTURA_EDITAL_NAO_MENSURAVEL"] },
};
const confirmed: PlanoGuiadoResponse = { concurso_id: "contest-1", cronograma_id: "schedule-1", criado: true, disciplinas_criadas: 1, topicos_criados: 1, sessoes_planejadas: 1, preview };

async function review() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/planos/novo"]}><Routes><Route path="/planos/novo" element={<PlanoGuiado />} /><Route path="/cronograma" element={<h1>Cronograma selecionado</h1>} /></Routes></MemoryRouter></QueryClientProvider>);
  await userEvent.click(await screen.findByRole("button", { name: "Retomar rascunho" }));
  await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
  await screen.findByRole("button", { name: "Criar plano e gerar cronograma" });
  return { invalidate };
}

describe("PlanoGuiado — confirmação com cronograma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readOnboardingDraft).mockReturnValue({ status: "available", draft });
    vi.mocked(previewPlanejamento).mockResolvedValue(preview);
    vi.mocked(confirmarPlanoGuiado).mockResolvedValue(confirmed);
    mocks.transition.mockResolvedValue(true);
  });

  it("mostra resumo real e abre o cronograma do concurso criado", async () => {
    const { invalidate } = await review();
    await userEvent.click(screen.getByRole("button", { name: "Criar plano e gerar cronograma" }));
    await screen.findByRole("heading", { name: "Plano de estudos criado com sucesso!" });
    expect(screen.getByText("Concurso de auditor · Analista")).toBeInTheDocument();
    expect(screen.getByText("5h")).toBeInTheDocument();
    expect(screen.getByText("2 dias por semana")).toBeInTheDocument();
    expect(screen.getByText("1 disciplina · 1 sessão")).toBeInTheDocument();
    expect(screen.getByText("09/11/2026")).toBeInTheDocument();
    expect(screen.getByText("30/11/2026")).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["cronograma-planejamento"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(clearOnboardingDraft).toHaveBeenCalledWith("user-1");
    await userEvent.click(screen.getByRole("button", { name: "Visualizar meu cronograma" }));
    await screen.findByRole("heading", { name: "Cronograma selecionado" });
    expect(mocks.transition).toHaveBeenLastCalledWith("contest-1");
  });

  it("bloqueia envios enquanto aguarda a geração e não simula sucesso", async () => {
    let resolve!: (value: PlanoGuiadoResponse) => void;
    vi.mocked(confirmarPlanoGuiado).mockImplementation(() => new Promise(value => { resolve = value; }));
    await review();
    await userEvent.click(screen.getByRole("button", { name: "Criar plano e gerar cronograma" }));
    const pending = screen.getByRole("button", { name: "Criando plano e gerando cronograma…" });
    expect(pending).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: "Plano de estudos criado com sucesso!" })).not.toBeInTheDocument();
    await userEvent.click(pending);
    expect(confirmarPlanoGuiado).toHaveBeenCalledTimes(1);
    await act(async () => resolve(confirmed));
    await screen.findByRole("heading", { name: "Plano de estudos criado com sucesso!" });
  });

  it.each(["falha", "sem_cronograma", "sem_sessoes"])("preserva formulário e chave para recuperar %s", async failure => {
    if (failure === "falha") vi.mocked(confirmarPlanoGuiado).mockRejectedValueOnce(new Error("Falha da API"));
    else vi.mocked(confirmarPlanoGuiado).mockResolvedValueOnce({ ...confirmed, ...(failure === "sem_cronograma" ? { cronograma_id: null } : { sessoes_planejadas: 0 }) });
    await review();
    await userEvent.click(screen.getByRole("button", { name: "Criar plano e gerar cronograma" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: "Plano de estudos criado com sucesso!" })).not.toBeInTheDocument();
    expect(clearOnboardingDraft).not.toHaveBeenCalled();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Criar plano e gerar cronograma" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Criar plano e gerar cronograma" }));
    await screen.findByRole("heading", { name: "Plano de estudos criado com sucesso!" });
    expect(vi.mocked(confirmarPlanoGuiado).mock.calls[0][0].idempotency_key).toBe("guided-test-1");
    expect(vi.mocked(confirmarPlanoGuiado).mock.calls[1][0].idempotency_key).toBe("guided-test-1");
  });
});
