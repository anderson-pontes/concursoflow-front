import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Target,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const location = useLocation();
  const editalNavigation = location.state as { editalReturnTo?: string; editalReturnState?: Record<string, unknown> } | null;
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
  const editBaseline = React.useRef("");
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const closeTopicEditor = async () => {
    if (renomearTopico.isPending) return;
    if (!editing || editing.descricao === editBaseline.current || await requestConfirmation({ title: "Descartar altera\u00e7\u00f5es?", description: "O nome do tópico ainda n\u00e3o foi salvo.", confirmLabel: "Descartar", cancelLabel: "Continuar editando", variant: "destructive" })) setEditing(null);
  };
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
        dominio: payload.concluido ? 5 : 1,
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
      <div className="p-6 text-sm text-muted-foreground">
        Disciplina inválida. <Link to="/disciplinas">Voltar</Link>
      </div>
    );
  }

  const k = data?.kpis;

  return (
    <div className="min-w-0 w-full space-y-5 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to={editalNavigation?.editalReturnTo ?? "/disciplinas"}
            state={editalNavigation?.editalReturnState}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Disciplinas
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-2xl">
            {isLoading ? "Carregando…" : data?.nome ?? "Disciplina"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe seu desempenho e organize os tópicos do edital.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRegistroTopicosPrefill(null);
            setOpenRegistro(true);
          }}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
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
        <div data-discipline-kpis className="discipline-kpis grid grid-cols-2 items-stretch gap-3 xl:grid-cols-5 xl:gap-4">
          <KpiCard title="Tempo de estudo" icon={Clock} tone="indigo" className="col-span-2 xl:col-span-1">
            <strong className="text-2xl tabular-nums">{fmtHoras(k.tempo_estudo_horas)}</strong>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Sessões registradas nesta disciplina</p>
          </KpiCard>
          <KpiCard title="Desempenho geral" icon={Target} tone="emerald">
            <strong className="text-2xl tabular-nums">{k.questoes_resolvidas_total > 0 ? `${k.desempenho_geral_pct}%` : "Sem questões"}</strong>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{k.questoes_certas_total} certas · {k.questoes_erradas_total} erradas</p>
          </KpiCard>
          <KpiCard title="Progresso no edital" icon={BookOpen} tone="violet">
            <strong className="text-2xl tabular-nums">{k.progresso_edital_pct}%</strong>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{k.topicos_concluidos} concluídos · {k.topicos_pendentes} pendentes ({k.topicos_total} tópicos)</p>
          </KpiCard>
          <KpiCard title="Questões resolvidas" icon={ListChecks} tone="blue">
            <strong className="text-2xl tabular-nums">{k.questoes_resolvidas_total}</strong>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{k.questoes_certas_total} certas · {k.questoes_erradas_total} erradas · {k.questoes_branco_total} em branco</p>
          </KpiCard>
          <KpiCard title="Páginas estudadas" icon={FileText} tone="amber">
            <strong className="text-2xl tabular-nums">{(k.paginas_lidas_total ?? 0).toLocaleString("pt-BR")}</strong>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Soma dos blocos de páginas nos registros de estudo</p>
          </KpiCard>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5" role="status" aria-label="Carregando indicadores">
          {[1,2,3,4,5].map(i => <div key={i} className={`h-28 animate-pulse rounded-xl bg-muted ${i === 1 ? "col-span-2 xl:col-span-1" : ""}`} />)}
        </div>
      ) : null}

      <DisciplinaDashboardTopicosTable
        disciplinaId={disciplinaId}
        data={data}
        isLoading={isLoading}
        isDemoMode={isDemoMode}
        topicosModalOpen={topicosModalOpen}
        onTopicosModalOpenChange={setTopicosModalOpen}
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
        onEditTopico={(topic) => { editBaseline.current = topic.descricao; setEditing(topic); }}
        highlightedTopicoId={highlightTopicoId}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) void closeTopicEditor(); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Editar tópico</DialogTitle>
          <DialogDescription>Atualize o nome do assunto mantendo seu histórico de estudos.</DialogDescription>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (editing && editing.descricao.trim()) renomearTopico.mutate({ topicoId: editing.id, descricao: editing.descricao.trim() }); }}>
            <div className="space-y-2"><Label htmlFor="topic-name">Nome do tópico</Label><Input id="topic-name" autoFocus required disabled={renomearTopico.isPending} value={editing?.descricao ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, descricao: event.target.value } : current)} /></div>
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={renomearTopico.isPending} onClick={() => void closeTopicEditor()}>Cancelar</Button><Button type="submit" disabled={!editing?.descricao.trim() || renomearTopico.isPending}>{renomearTopico.isPending ? "Salvando..." : "Salvar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
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
