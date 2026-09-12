import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import { ReplanejamentoComparativo } from "@/components/planejamento/ReplanejamentoComparativo";
import type { PlanejamentoComparativo } from "@/types/planejamento";

const base: PlanejamentoComparativo = {
  versao_contrato: 1,
  baseline_versao: "cronograma-baseline-v1",
  baseline_fingerprint: "a".repeat(64),
  preview_fingerprint: "b".repeat(64),
  fronteira: { data_inicio: "2026-09-14", data_fim_anterior: null, data_fim_proposta: "2026-10-14" },
  resumo: { antes_itens: 2, depois_itens: 2, antes_minutos: 90, depois_minutos: 100, adicionados: 1, removidos: 1, movidos: 1, preservados: 0, itens_comparativo: 3 },
  grupos: {
    adicionados: [{ comparacao_id: "a1", classificacao: "adicionado", motivo: "NOVA_SESSAO", disciplina_id: "d1", disciplina_nome: "Português", duracao_anterior_minutos: null, duracao_nova_minutos: 40, posicao_anterior: null, posicao_nova: { data: "2026-09-18", ordem_no_dia: 1 }, par_comparacao: null }],
    removidos: [{ comparacao_id: "r1", classificacao: "removido", motivo: "FORA_DA_NOVA_PROPOSTA", disciplina_id: "d1", disciplina_nome: "Português", duracao_anterior_minutos: 30, duracao_nova_minutos: null, posicao_anterior: { data: "2026-09-14", ordem_no_dia: 1 }, posicao_nova: null, par_comparacao: null }],
    movidos: [{ comparacao_id: "m1", classificacao: "movido", motivo: "DATA_ALTERADA", disciplina_id: "d2", disciplina_nome: "Direito", duracao_anterior_minutos: 60, duracao_nova_minutos: 60, posicao_anterior: { data: "2026-09-15", ordem_no_dia: 1 }, posicao_nova: { data: "2026-09-16", ordem_no_dia: 1 }, par_comparacao: null }],
    preservados: [],
  },
};

test("apresenta resumo textual, proteção e quatro grupos acessíveis", async () => {
  const user = userEvent.setup();
  render(<ReplanejamentoComparativo comparativo={base} />);

  expect(screen.getByRole("heading", { name: "O que muda no seu planejamento" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Histórico, sessões já realizadas e revisões");
  expect(screen.getAllByRole("tab")).toHaveLength(4);
  expect(screen.getByText("Fora da nova proposta")).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Sessões remanejadas (1)" }));
  expect(screen.getByText("Data alterada")).toBeInTheDocument();
});

test("explica claramente quando não há mudanças", () => {
  render(<ReplanejamentoComparativo comparativo={{ ...base, resumo: { ...base.resumo, adicionados: 0, removidos: 0, movidos: 0, preservados: 2, itens_comparativo: 2 }, grupos: { adicionados: [], removidos: [], movidos: [], preservados: [] } }} />);

  expect(screen.getByText("A nova distribuição mantém todas as sessões futuras como estão.")).toBeInTheDocument();
});
