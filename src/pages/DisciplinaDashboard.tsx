import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Circle,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { TopicoDetalhesModal } from "@/components/estudos/TopicoDetalhesModal";

import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { getMockDisciplinaDashboard } from "@/mocks/disciplinaDashboardMock";
import type { DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";

function useDisciplinaDashboardDemoMode() {
  const [searchParams] = useSearchParams();
  const fromQuery =
    searchParams.get("mock") === "1" ||
    searchParams.get("mock")?.toLowerCase() === "true";
  const fromEnv = import.meta.env.VITE_DISCIPLINA_DASHBOARD_MOCK === "true";
  return fromEnv || fromQuery;
}

function fmtHoras(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

function fmtTempoTopico(min: number) {
  if (min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function KpiCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-card",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-neutral-400">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function DisciplinaDashboard() {
  const { disciplinaId } = useParams<{ disciplinaId: string }>();
  const qc = useQueryClient();
  const isDemoMode = useDisciplinaDashboardDemoMode();

  const demoToast = React.useCallback(() => {
    toast.info("Modo demonstração", {
      description: "Os dados são fictícios e as alterações não são salvas. Remova ?mock=1 da URL para usar o painel real.",
    });
  }, []);

  const [novoTopico, setNovoTopico] = React.useState("");
  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [editSessaoId, setEditSessaoId] = React.useState<string | null>(null);
  const [detalhesTopico, setDetalhesTopico] = React.useState<{ id: string; descricao: string } | null>(null);
  const [editing, setEditing] = React.useState<{ id: string; descricao: string } | null>(null);
  const [menuRow, setMenuRow] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuRow) return;
    const fn = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuRow(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuRow]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["disciplina-dashboard", disciplinaId, isDemoMode ? "demo" : "live"],
    enabled: Boolean(disciplinaId),
    queryFn: async () => {
      if (isDemoMode && disciplinaId) {
        return getMockDisciplinaDashboard(disciplinaId);
      }
      return (await api.get(`/disciplinas/${disciplinaId}/dashboard`)).data as DisciplinaDashboardResponse;
    },
  });

  const toggleConcluido = useMutation({
    mutationFn: async (payload: { topicoId: string; concluido: boolean }) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.put(`/disciplinas/${disciplinaId}/topicos/${payload.topicoId}`, {
        status: payload.concluido ? "dominado" : "nao_iniciado",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const criarTopico = useMutation({
    mutationFn: async (descricao: string) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.post(`/disciplinas/${disciplinaId}/topicos`, {
        descricao,
        status: "nao_iniciado",
        numero_ordem: 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      setNovoTopico("");
      toast.success("Tópico criado.");
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const atualizarTopico = useMutation({
    mutationFn: async (payload: { topicoId: string; descricao: string }) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.put(`/disciplinas/${disciplinaId}/topicos/${payload.topicoId}`, { descricao: payload.descricao });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      setEditing(null);
      toast.success("Tópico atualizado.");
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const excluirTopico = useMutation({
    mutationFn: async (topicoId: string) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.delete(`/disciplinas/${disciplinaId}/topicos/${topicoId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      toast.success("Tópico removido.");
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  if (!disciplinaId) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Disciplina inválida. <Link to="/disciplinas">Voltar</Link>
      </div>
    );
  }

  const k = data?.kpis;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/disciplinas"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Disciplinas
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-neutral-50">
            {isLoading ? "Carregando…" : data?.nome ?? "Disciplina"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Dashboard de desempenho e edital verticalizado</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenRegistro(true)}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          Adicionar Estudo
        </button>
      </div>

      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error instanceof Error ? error.message : "Não foi possível carregar o dashboard."}
        </div>
      ) : null}

      {isDemoMode ? (
        <div
          role="status"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"
        >
          <strong className="font-semibold">Modo demonstração.</strong>{" "}
          <span className="text-indigo-900/90 dark:text-indigo-200">
            Os KPIs e a tabela usam dados fictícios; criar, editar, excluir e marcar tópicos estão desativados. Use{" "}
            <code className="rounded bg-indigo-100/80 px-1.5 py-0.5 text-xs dark:bg-indigo-900/80">?mock=1</code> na URL
            ou defina <code className="rounded bg-indigo-100/80 px-1.5 py-0.5 text-xs dark:bg-indigo-900/80">VITE_DISCIPLINA_DASHBOARD_MOCK=true</code> para ativar.
            Remova-os para carregar o painel real da API.
          </span>
        </div>
      ) : null}

      {k ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard title="Tempo de estudo">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{fmtHoras(k.tempo_estudo_horas)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Sessões registradas nesta disciplina</p>
          </KpiCard>

          <KpiCard title="Desempenho geral">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{k.desempenho_geral_pct}%</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-emerald-600">{k.questoes_certas_total} certas</span>
              {" · "}
              <span className="font-medium text-rose-500">{k.questoes_erradas_total} erradas</span>
            </p>
          </KpiCard>

          <KpiCard title="Progresso no edital">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{k.progresso_edital_pct}%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {k.topicos_concluidos} concluídos · {k.topicos_pendentes} pendentes ({k.topicos_total} tópicos)
            </p>
          </KpiCard>

          <KpiCard title="Questões resolvidas">
            <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{k.questoes_resolvidas_total}</div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">Certas {k.questoes_certas_total}</span>
              <span className="text-rose-500 dark:text-rose-400">Erradas {k.questoes_erradas_total}</span>
              <span className="text-slate-400">Branco {k.questoes_branco_total}</span>
            </div>
          </KpiCard>

          <KpiCard title="Páginas estudadas">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-sky-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                {(k.paginas_lidas_total ?? 0).toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Soma dos blocos de páginas nos registros de estudo</p>
          </KpiCard>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-card">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Edital verticalizado</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Tópicos, métricas de questões e tempo por assunto</p>
        </div>

        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={cn(
                "h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition",
                "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
                isDemoMode && "cursor-not-allowed opacity-60",
              )}
              placeholder="Novo tópico (ex.: Impostos Municipais)"
              value={novoTopico}
              disabled={isDemoMode}
              onChange={(e) => setNovoTopico(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = novoTopico.trim();
                  if (t && !isDemoMode) criarTopico.mutate(t);
                }
              }}
            />
            <button
              type="button"
              disabled={!novoTopico.trim() || criarTopico.isPending || isDemoMode}
              onClick={() => {
                const t = novoTopico.trim();
                if (t && !isDemoMode) criarTopico.mutate(t);
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </div>
        </div>

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
                        onClick={() => setMenuRow((m) => (m === row.id ? null : row.id))}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuRow === row.id ? (
                        <div className="absolute right-2 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                            onClick={() => {
                              setMenuRow(null);
                              setDetalhesTopico({ id: row.id, descricao: row.descricao });
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver detalhes
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                            onClick={() => {
                              setMenuRow(null);
                              setEditing({ id: row.id, descricao: row.descricao });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Renomear
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            onClick={() => {
                              setMenuRow(null);
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

      {editing ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 dark:bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-950">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Editar tópico</h3>
            <input
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              value={editing.descricao}
              onChange={(e) => setEditing((s) => (s ? { ...s, descricao: e.target.value } : s))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-neutral-600"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={!editing.descricao.trim() || atualizarTopico.isPending}
                onClick={() =>
                  atualizarTopico.mutate({ topicoId: editing.id, descricao: editing.descricao.trim() })
                }
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <RegistroEstudoModal
        open={openRegistro || Boolean(editSessaoId)}
        onClose={() => {
          setOpenRegistro(false);
          setEditSessaoId(null);
        }}
        defaultDisciplinaId={disciplinaId}
        sessaoId={editSessaoId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["topico-sessoes", disciplinaId] });
        }}
      />
      {detalhesTopico && disciplinaId ? (
        <TopicoDetalhesModal
          open
          disciplinaId={disciplinaId}
          topicoId={detalhesTopico.id}
          topicoNome={detalhesTopico.descricao}
          onClose={() => setDetalhesTopico(null)}
          onEditSessao={(sid) => setEditSessaoId(sid)}
        />
      ) : null}
    </div>
  );
}
