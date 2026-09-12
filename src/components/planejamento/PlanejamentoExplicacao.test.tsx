import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { PlanejamentoCapacidadeAlert, PlanejamentoExplicacao, PlanejamentoPreviewStaleDialog } from "@/components/planejamento/PlanejamentoExplicacao";
import type { PlanejamentoPreview } from "@/types/planejamento";

const preview: PlanejamentoPreview = {
  sessoes: [{ disciplina_id: null, disciplina_nome: "Português", data: "2026-09-14", dia_semana: 0, duracao_minutos: 60, ordem: 1 }],
  minutos_totais: 60,
  carga_semanal_minutos: 60,
  prioridades: { Português: 15 },
  preview_fingerprint: "a".repeat(64),
  explicacao: {
    versao_contrato: 1,
    algoritmo_versao: "planejamento-v1",
    confirmavel: true,
    capacidade: {
      capacidade_informada_minutos: 60,
      capacidade_planejavel_minutos: 60,
      carga_alocada_minutos: 60,
      saldo_nao_planejavel_minutos: 0,
      dias_disponiveis: 1,
      dias_utilizados: 1,
      encaixe_calendario: "viavel",
      cobertura_edital: "indeterminada_sem_estimativa_esforco",
    },
    disciplinas: [{
      disciplina_id: null,
      disciplina_nome: "Português",
      peso: 5,
      conhecimento: "regular",
      fator_conhecimento: 3,
      prioridade: 15,
      minutos_alocados: 60,
      sessoes: 1,
      dias_utilizados: 1,
      participacao_bps: 10_000,
    }],
    alertas: ["COBERTURA_EDITAL_NAO_MENSURAVEL"],
  },
};

test("explica a distribuição em texto e abre a justificativa por teclado", async () => {
  const user = userEvent.setup();
  render(<PlanejamentoExplicacao preview={preview} />);

  expect(screen.getByRole("heading", { name: "Como seu plano foi distribuído" })).toBeInTheDocument();
  expect(screen.getByText(/Ainda não estimamos se esse tempo cobre todo o edital/)).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: /Participação de Português/ })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Ver justificativa" }));
  expect(screen.getByText("15 (5 × 3)")).toBeInTheDocument();
  expect(screen.getByText(/não representa percentual de domínio/)).toBeInTheDocument();
});

test("mostra diagnóstico concreto quando faltam slots", () => {
  render(<PlanejamentoCapacidadeAlert diagnostico={{ motivo: "PLANEJAMENTO_DISCIPLINAS_SEM_SLOT", capacidadeInformadaMinutos: 60, capacidadePlanejavelMinutos: 60, diasDisponiveis: 1, slots: 1, disciplinas: 3 }} />);

  expect(screen.getByRole("alert")).toHaveTextContent("Há 1 sessões possíveis para 3 disciplinas");
});

test("distingue uma prévia sem sessões e impede confirmação implícita", () => {
  render(
    <PlanejamentoExplicacao
      preview={{
        ...preview,
        sessoes: [],
        explicacao: { ...preview.explicacao, confirmavel: false, disciplinas: [] },
      }}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Não há sessões para confirmar");
  expect(screen.queryByText("A distribuição cabe no período informado")).not.toBeInTheDocument();
});

test("exige nova prévia após conflito sem confirmar automaticamente", async () => {
  const user = userEvent.setup();
  const onRegenerate = vi.fn();
  render(
    <PlanejamentoPreviewStaleDialog
      open
      onOpenChange={() => undefined}
      onRegenerate={onRegenerate}
      onReview={() => undefined}
    />,
  );

  expect(screen.getByRole("alertdialog")).toHaveTextContent("Seu plano mudou desde a prévia");
  await user.click(screen.getByRole("button", { name: "Gerar nova prévia" }));
  expect(onRegenerate).toHaveBeenCalledOnce();
});
