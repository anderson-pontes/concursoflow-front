import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  Check,
  Circle,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { TopicosModal } from "@/components/disciplinas/TopicosModal";
import type { RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";
import { fmtTempoTopico } from "@/lib/disciplinaDashboard/format";
import { cn } from "@/lib/utils";
import type { DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";

type ToggleConcluidoMutation = UseMutationResult<
  void,
  Error,
  { topicoId: string; concluido: boolean },
  unknown
>;

type CriarTopicosMutation = UseMutationResult<void, Error, string[], unknown>;

type ExcluirTopicoMutation = UseMutationResult<void, Error, string, unknown>;

export type DisciplinaDashboardTopicosTableProps = {
  disciplinaId: string;
  data: DisciplinaDashboardResponse | undefined;
  isLoading: boolean;
  isDemoMode: boolean;
  topicosModalOpen: boolean;
  onTopicosModalOpenChange: (open: boolean) => void;
  menuRow: string | null;
  onMenuRowChange: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  toggleConcluido: ToggleConcluidoMutation;
  criarTopicos: CriarTopicosMutation;
  excluirTopico: ExcluirTopicoMutation;
  onDemoToast: () => void;
  onDetalhesTopico: (topico: { id: string; descricao: string }) => void;
  onRegistroTopico: (prefill: RegistroDefaultTopico[]) => void;
  onEditTopico: (topico: { id: string; descricao: string }) => void;
};

export function DisciplinaDashboardTopicosTable({
  disciplinaId,
  data,
  isLoading,
  isDemoMode,
  topicosModalOpen,
  onTopicosModalOpenChange,
  menuRow,
  onMenuRowChange,
  menuRef,
  toggleConcluido,
  criarTopicos,
  excluirTopico,
  onDemoToast,
  onDetalhesTopico,
  onRegistroTopico,
  onEditTopico,
}: DisciplinaDashboardTopicosTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-card">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Edital verticalizado</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Tópicos, métricas de questões e tempo por assunto</p>
      </div>

      <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
        <button
          type="button"
          disabled={isDemoMode}
          onClick={() => onTopicosModalOpenChange(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Adicionar tópicos
        </button>
        <p className="mt-2 text-xs text-slate-500 dark:text-neutral-500">
          Adicione um ou vários tópicos de uma vez; no modal, cada linha vira um tópico.
        </p>
      </div>

      <TopicosModal
        open={topicosModalOpen}
        onClose={() => onTopicosModalOpenChange(false)}
        disciplinaId={disciplinaId}
        disabled={isDemoMode}
        onSave={async (topicos) => {
          if (isDemoMode) {
            onDemoToast();
            throw new Error("DEMO_MODE");
          }
          await criarTopicos.mutateAsync(topicos);
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
              <th className="w-12 px-4 py-3 text-center" scope="col">
                <span className="sr-only">Concluído</span>
              </th>
              <th className="px-4 py-3" scope="col">
                Tópico
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Certas
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Erradas
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Branco
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Aproveitamento
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Tempo
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                Páginas
              </th>
              <th className="w-14 px-2 py-3" scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(data?.topicos ?? []).map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 transition hover:bg-slate-50/80 dark:border-neutral-800 dark:hover:bg-neutral-900/40"
              >
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={row.concluido_edital}
                    disabled={toggleConcluido.isPending || isDemoMode}
                    title={isDemoMode ? "Indisponível no modo demonstração" : undefined}
                    onClick={() =>
                      toggleConcluido.mutate({ topicoId: row.id, concluido: !row.concluido_edital })
                    }
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
                      row.concluido_edital
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
                    )}
                  >
                    {row.concluido_edital ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </button>
                </td>
                <td className="max-w-[240px] px-4 py-3 font-medium text-slate-900 dark:text-neutral-100">
                  <span className="line-clamp-2">{row.descricao}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {row.certas}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 font-medium text-rose-500 dark:text-rose-400">
                    <X className="h-3.5 w-3.5" aria-hidden />
                    {row.erradas}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                    <Circle className="h-3.5 w-3.5" aria-hidden />
                    {row.em_branco}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-neutral-200">
                  {row.aproveitamento_pct}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-neutral-300">
                  {fmtTempoTopico(row.tempo_estudo_minutos)}
                </td>
                <td className="px-4 py-3 text-center tabular-nums text-slate-700 dark:text-neutral-200">
                  {(row.paginas_lidas ?? 0) > 0 ? (row.paginas_lidas ?? 0).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="relative px-2 py-3">
                  <div ref={menuRow === row.id ? menuRef : undefined}>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
                      aria-label="Ações do tópico"
                      disabled={isDemoMode}
                      title={isDemoMode ? "Indisponível no modo demonstração" : undefined}
                      onClick={() => onMenuRowChange(menuRow === row.id ? null : row.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuRow === row.id ? (
                      <div className="absolute right-2 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                          onClick={() => {
                            onMenuRowChange(null);
                            onDetalhesTopico({ id: row.id, descricao: row.descricao });
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver registros de estudo
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                          onClick={() => {
                            onMenuRowChange(null);
                            onRegistroTopico([{ id: row.id, nome: row.descricao }]);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Novo registro neste tópico
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                          onClick={() => {
                            onMenuRowChange(null);
                            onEditTopico({ id: row.id, descricao: row.descricao });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Renomear
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          onClick={() => {
                            onMenuRowChange(null);
                            if (window.confirm("Excluir este tópico?")) excluirTopico.mutate(row.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data && data.topicos.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Nenhum tópico cadastrado. Adicione o primeiro acima.</p>
        ) : null}
      </div>
    </section>
  );
}
