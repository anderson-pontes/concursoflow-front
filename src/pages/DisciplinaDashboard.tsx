import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { DisciplinaDashboardTopicosTable } from "@/components/disciplinaDashboard/DisciplinaDashboardTopicosTable";
import { KpiCard } from "@/components/disciplinaDashboard/KpiCard";
import { RegistroEstudoModal, type RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";
import { TopicoDetalhesModal } from "@/components/estudos/TopicoDetalhesModal";
import { useDisciplinaDashboardDemoMode } from "@/hooks/useDisciplinaDashboardDemoMode";
import { fmtHoras } from "@/lib/disciplinaDashboard/format";
import { getMockDisciplinaDashboard } from "@/mocks/disciplinaDashboardMock";
import { api } from "@/services/api";
import type { DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";

export function DisciplinaDashboard() {
  const { disciplinaId } = useParams<{ disciplinaId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const isDemoMode = useDisciplinaDashboardDemoMode();

  const topicoFromUrl = searchParams.get("topico");
  const [highlightTopicoId, setHighlightTopicoId] = React.useState<string | null>(null);
  const topicoScrollRef = React.useRef(false);

  React.useEffect(() => {
    if (!topicoFromUrl) return;
    setHighlightTopicoId(topicoFromUrl);
    const t = window.setTimeout(() => setHighlightTopicoId(null), 2000);
    return () => window.clearTimeout(t);
  }, [topicoFromUrl]);

  const demoToast = React.useCallback(() => {
    toast.info("Modo demonstração", {
      description: "Os dados são fictícios e as alterações não são salvas. Remova ?mock=1 da URL para usar o painel real.",
    });
  }, []);

  const [topicosModalOpen, setTopicosModalOpen] = React.useState(false);
  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [editSessaoId, setEditSessaoId] = React.useState<string | null>(null);
  const [registroTopicosPrefill, setRegistroTopicosPrefill] = React.useState<RegistroDefaultTopico[] | null>(null);
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

  React.useEffect(() => {
    if (!data?.topicos || !topicoFromUrl || topicoScrollRef.current) return;
    const el = document.querySelector(`[data-topico-id="${topicoFromUrl}"]`);
    if (!el) return;
    topicoScrollRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setSearchParams({}, { replace: true });
  }, [data?.topicos, topicoFromUrl, setSearchParams]);

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
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const criarTopicos = useMutation({
    mutationFn: async (descricoes: string[]) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      for (const descricao of descricoes) {
        await api.post(`/disciplinas/${disciplinaId}/topicos`, {
          descricao,
          status: "nao_iniciado",
        });
      }
    },
    onSuccess: (_, descricoes) => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      toast.success(
        descricoes.length > 1 ? `${descricoes.length} tópicos criados.` : "Tópico criado.",
      );
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const renomearTopico = useMutation({
    mutationFn: async (payload: { topicoId: string; descricao: string }) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.put(`/disciplinas/${disciplinaId}/topicos/${payload.topicoId}`, { descricao: payload.descricao });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      setEditing(null);
      toast.success("Tópico atualizado.");
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const atualizarTopico = useMutation({
    mutationFn: async (payload: { topicoId: string; patch: { peso?: number; dominio?: number } }) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.put(`/disciplinas/${disciplinaId}/topicos/${payload.topicoId}`, payload.patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") demoToast();
    },
  });

  const reordenarTopicos = useMutation({
    mutationFn: async (ordem: string[]) => {
      if (isDemoMode) {
        throw new Error("DEMO_MODE");
      }
      await api.patch(`/disciplinas/${disciplinaId}/topicos/reordenar`, { ordem });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "DEMO_MODE") {
        demoToast();
        return;
      }
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
      toast.error("Não foi possível salvar a ordem dos tópicos.");
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
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
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
          onClick={() => {
            setRegistroTopicosPrefill(null);
            setOpenRegistro(true);
          }}
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

      <DisciplinaDashboardTopicosTable
        disciplinaId={disciplinaId}
        data={data}
        isLoading={isLoading}
        isDemoMode={isDemoMode}
        topicosModalOpen={topicosModalOpen}
        onTopicosModalOpenChange={setTopicosModalOpen}
        menuRow={menuRow}
        onMenuRowChange={setMenuRow}
        menuRef={menuRef}
        toggleConcluido={toggleConcluido}
        criarTopicos={criarTopicos}
        excluirTopico={excluirTopico}
        reordenarTopicos={reordenarTopicos}
        atualizarTopico={atualizarTopico}
        onDemoToast={demoToast}
        onDetalhesTopico={setDetalhesTopico}
        onRegistroTopico={(prefill) => {
          setRegistroTopicosPrefill(prefill);
          setOpenRegistro(true);
        }}
        onEditTopico={setEditing}
        highlightedTopicoId={highlightTopicoId}
      />

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
                disabled={!editing.descricao.trim() || renomearTopico.isPending}
                onClick={() =>
                  renomearTopico.mutate({ topicoId: editing.id, descricao: editing.descricao.trim() })
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
          setRegistroTopicosPrefill(null);
        }}
        defaultDisciplinaId={disciplinaId}
        defaultTopicos={editSessaoId ? null : registroTopicosPrefill}
        sessaoId={editSessaoId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["topico-sessoes", disciplinaId] });
          qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
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
