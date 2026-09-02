import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Flame, RefreshCw, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { CalendarioMensalWidget } from "@/components/calendario/CalendarioMensalWidget";
import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
import { DashboardKpis, DashboardWeeklySchedule } from "@/components/dashboard/DashboardOverview";
import {
  DashboardContextHeader,
  NextActionCard,
  SecondarySection,
  TodayPlanCard,
  UrgentReviewsCard,
  WeeklyGoalCard,
  type DashboardContest,
  type NextStudy,
  type PendingReview,
  type TodayPlanItem,
} from "@/components/dashboard/DashboardPrimary";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Progress } from "@/components/ui/progress";
import { resolveConcursoContextStatus } from "@/lib/concursos/context";
import { blocoDurationMinutes, DIAS } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { resolveDashboardActionState } from "@/lib/dashboard/presentation";
import { calendarDaysFromToday, formatNumericDate } from "@/lib/dashboard/dates";
import type { Disciplina } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { trackTelemetry } from "@/services/telemetry";
import { useConcursoAtivoId, useConcursoContextError, useConcursoContextResolved } from "@/stores/concursoStore";

type DashboardResumo = {
  horas_hoje: number;
  meta_horas: number;
  horas_semana: number;
  sessoes_semana: number;
  questoes_semana: number;
  rendimento_medio: number;
  avisos_proximos: number;
  flashcards_para_revisar: number;
  streak_dias?: number;
  taxa_cumprimento_mes?: number;
  minutos_planejados_mes?: number;
  minutos_realizados_mes?: number;
};

type RevisoesPendentes = { total: number; items: PendingReview[] };
type HeatmapData = { date: string; count: number; minutes?: number };
type Aviso = { id: string; titulo: string; data_vencimento: string; prioridade: string };
type Concurso = DashboardContest & { id: string };
type ProximoEstudo = NextStudy & { item_id: string; concurso_id: string; sessoes_recentes: number };

const RegistroEstudoModal = React.lazy(async () => {
  const module = await import("@/components/estudos/RegistroEstudoModal");
  return { default: module.RegistroEstudoModal };
});

export function Dashboard() {
  const queryClient = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();
  const contextResolved = useConcursoContextResolved();
  const contextError = useConcursoContextError();
  const viewedStateRef = React.useRef<string | null>(null);
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroPrefill, setRegistroPrefill] = React.useState<{ disciplinaId: string; topicoId?: string | null } | null>(null);

  const resumoQuery = useQuery({
    queryKey: ["dashboard-resumo", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/dashboard/resumo", { params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {} })).data as DashboardResumo,
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const heatmapQuery = useQuery({
    queryKey: ["dashboard-heatmap"],
    queryFn: async () => (await api.get("/dashboard/heatmap")).data as HeatmapData[],
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const concursosQuery = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });
  const proximoQuery = useQuery({
    queryKey: ["dashboard", "proximo-estudo", concursoAtivoId],
    queryFn: async () => (await api.get<ProximoEstudo | null>("/dashboard/proximo-estudo", { params: { concurso_id: concursoAtivoId } })).data,
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const revisoesQuery = useQuery({
    queryKey: ["dashboard", "revisoes-pendentes", concursoAtivoId],
    queryFn: async () => (await api.get<RevisoesPendentes>("/dashboard/revisoes-pendentes", { params: { concurso_id: concursoAtivoId } })).data,
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const disciplinasQuery = useQuery({
    queryKey: ["disciplinas", "dashboard", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/disciplinas", { params: { include_topicos_stats: true, ...(concursoAtivoId ? { concurso_id: concursoAtivoId } : {}) } })).data as Disciplina[],
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const blocosQuery = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/cronograma/blocos", { params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {} })).data as Bloco[],
    enabled: contextResolved && Boolean(concursoAtivoId),
  });
  const avisosQuery = useQuery({
    queryKey: ["avisos-concurso", concursoAtivoId],
    queryFn: async () => {
      const rows = (await api.get(`/avisos/concurso/${concursoAtivoId}`)).data as Aviso[];
      const today = new Date();
      return rows.filter((aviso) => {
        const daysUntilDue = calendarDaysFromToday(aviso.data_vencimento, today);
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      });
    },
    enabled: contextResolved && Boolean(concursoAtivoId),
  });

  const concursoAtivo = React.useMemo(() => concursosQuery.data?.find((contest) => contest.id === concursoAtivoId) ?? null, [concursosQuery.data, concursoAtivoId]);
  const diasParaProva = React.useMemo(() => concursoAtivo?.data_prova ? calendarDaysFromToday(concursoAtivo.data_prova) : null, [concursoAtivo]);
  const discMap = React.useMemo(() => new Map((disciplinasQuery.data ?? []).map((discipline) => [discipline.id, discipline.nome])), [disciplinasQuery.data]);
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[new Date().getDay()];
  const blocosSemana = React.useMemo(() => {
    if (!concursoAtivoId || !blocosQuery.data) return undefined;
    const ids = new Set((disciplinasQuery.data ?? []).map((discipline) => discipline.id));
    const map = Object.fromEntries(DIAS.map((day) => [day, [] as Bloco[]])) as Record<Bloco["dia_semana"], Bloco[]>;
    for (const bloco of blocosQuery.data.filter((item) => ids.has(item.disciplina_id))) map[bloco.dia_semana]?.push(bloco);
    for (const day of DIAS) map[day] = [...map[day]].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return map;
  }, [blocosQuery.data, disciplinasQuery.data, concursoAtivoId]);
  const planoHoje = React.useMemo<TodayPlanItem[]>(() => (blocosSemana?.[diaHoje] ?? []).flatMap((bloco) => {
    const disciplina = discMap.get(bloco.disciplina_id);
    return disciplina ? [{ bloco, disciplina, minutos: blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim) }] : [];
  }), [blocosSemana, diaHoje, discMap]);
  const progressoDisciplinas = React.useMemo(() => (disciplinasQuery.data ?? [])
    .filter((discipline) => (discipline.topicos_total ?? 0) > 0)
    .sort((a, b) => ((b.topicos_estudados ?? 0) / (b.topicos_total ?? 1)) - ((a.topicos_estudados ?? 0) / (a.topicos_total ?? 1)))
    .slice(0, 8), [disciplinasQuery.data]);

  const contextStatus = resolveConcursoContextStatus({
    resolved: contextResolved,
    concursoId: concursoAtivoId,
    essentialError: contextError || concursosQuery.isError || disciplinasQuery.isError || blocosQuery.isError,
    essentialLoading: concursosQuery.data === undefined || disciplinasQuery.data === undefined || blocosQuery.data === undefined || proximoQuery.isLoading,
    disciplinesLoaded: disciplinasQuery.data !== undefined,
    disciplinesCount: disciplinasQuery.data?.length,
    planLoaded: blocosQuery.data !== undefined,
    plannedItemsCount: blocosQuery.data?.length,
    actionableItemsCount: proximoQuery.isError ? 1 : proximoQuery.data ? 1 : 0,
  });
  const presentationIsStable = contextStatus !== "ready" || (
    (resumoQuery.data !== undefined || resumoQuery.isError)
    && (revisoesQuery.data !== undefined || revisoesQuery.isError)
  );
  const actionState = presentationIsStable ? resolveDashboardActionState({
      contextStatus,
      overdueReviews: revisoesQuery.data?.items.filter((review) => review.dias_atraso > 0).length ?? 0,
      daysUntilExam: diasParaProva,
      hoursToday: resumoQuery.data?.horas_hoje ?? 0,
      dailyGoalHours: resumoQuery.data?.meta_horas ?? 0,
    }) : null;

  React.useEffect(() => {
    if (!concursoAtivoId || !actionState) return;
    const fingerprint = `${concursoAtivoId}:${actionState}`;
    if (viewedStateRef.current === fingerprint) return;
    viewedStateRef.current = fingerprint;
    trackTelemetry("next_action_viewed", { state: actionState });
  }, [actionState, concursoAtivoId]);

  const openManual = React.useCallback((disciplinaId: string, topicoId: string | null | undefined, source: "dashboard" | "schedule") => {
    setRegistroPrefill({ disciplinaId, topicoId });
    setRegistroOpen(true);
    trackTelemetry("manual_study_opened", { source });
  }, []);

  if (contextStatus === "hydrating") return <PageSkeleton cards={2} rows={3} />;
  if (contextStatus === "no_contest") return <div className="space-y-6 pb-8"><header><h1 className="text-2xl font-bold tracking-tight">Painel</h1><p className="text-sm text-muted-foreground">Comece escolhendo o contexto dos seus estudos.</p></header><BannerSemConcurso /></div>;
  if (contextStatus === "error") return <div className="space-y-6 pb-8"><header><h1 className="text-2xl font-bold tracking-tight">Painel</h1></header><Alert variant="destructive"><RefreshCw aria-hidden="true" /><AlertTitle>Não foi possível carregar o concurso ativo</AlertTitle><AlertDescription>Os dados anteriores foram ocultados. <Button type="button" variant="outline" size="sm" className="mt-3 block" onClick={() => void Promise.all([queryClient.invalidateQueries({ queryKey: ["concursos"] }), disciplinasQuery.refetch(), blocosQuery.refetch(), proximoQuery.refetch()])}>Tentar novamente</Button></AlertDescription></Alert></div>;

  const contestHeader = concursoAtivo ? <DashboardContextHeader contest={concursoAtivo} daysUntilExam={diasParaProva} /> : null;
  if (contextStatus === "no_disciplines") return <div className="space-y-6 pb-8">{contestHeader}<EmptyState icon={BookOpenCheck} title="Adicione as disciplinas deste concurso" description="O concurso está ativo, mas ainda não possui conteúdo para orientar seu planejamento." action={<Button asChild><Link to="/disciplinas">Adicionar disciplinas</Link></Button>} /></div>;
  if (contextStatus === "no_plan") return <div className="space-y-6 pb-8">{contestHeader}<EmptyState icon={Target} title="Configure seu planejamento" description="As disciplinas estão prontas. Agora distribua seus estudos na semana." action={<Button asChild><Link to="/cronograma">Criar cronograma</Link></Button>} /></div>;
  if (contextStatus === "empty_plan") return <div className="space-y-6 pb-8">{contestHeader}<EmptyState icon={RefreshCw} title="Seu plano precisa de ajuste" description="Há planejamento cadastrado, mas nenhuma próxima ação disponível." action={<Button asChild><Link to={`/planos/${concursoAtivoId}/replanejar`}>Replanejar</Link></Button>} /></div>;
  if (!concursoAtivo || !concursoAtivoId) return null;

  const stableActionState = actionState && !["no_plan", "empty_plan"].includes(actionState) ? actionState as "ready" | "completed" | "overdue" | "upcoming_exam" : "ready";
  const weeklyGoal = Math.max((resumoQuery.data?.meta_horas ?? 0) * 7, 0);
  const today = new Date();

  return (
    <div className="space-y-6 pb-8">
      <DashboardContextHeader contest={concursoAtivo} daysUntilExam={diasParaProva} />
      <NextActionCard
        study={proximoQuery.data}
        state={stableActionState}
        isError={proximoQuery.isError}
        onRetry={() => void proximoQuery.refetch()}
        onStart={() => trackTelemetry("next_action_started", { action_type: "study", source: "dashboard" })}
        onManual={() => {
          if (!proximoQuery.data) return;
          trackTelemetry("next_action_started", { action_type: "manual", source: "dashboard" });
          openManual(proximoQuery.data.disciplina_id, proximoQuery.data.topico_id, "dashboard");
        }}
        replanUrl={`/planos/${concursoAtivoId}/replanejar`}
      />

      <TodayPlanCard items={planoHoje} onRegister={(item) => openManual(item.bloco.disciplina_id, item.bloco.topico_id, "schedule")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyGoalCard hours={resumoQuery.data?.horas_semana ?? 0} goalHours={weeklyGoal} questions={resumoQuery.data?.questoes_semana ?? 0} isError={resumoQuery.isError} onRetry={() => void resumoQuery.refetch()} />
        <UrgentReviewsCard reviews={revisoesQuery.data?.items ?? []} total={revisoesQuery.data?.total ?? 0} isError={revisoesQuery.isError} onRetry={() => void revisoesQuery.refetch()} />
      </div>

      <SecondarySection>
        {progressoDisciplinas.length > 0 ? <Card aria-labelledby="subject-progress-title"><CardHeader><CardTitle id="subject-progress-title">Progresso no edital</CardTitle></CardHeader><CardContent className="space-y-4">{progressoDisciplinas.map((discipline) => { const total = discipline.topicos_total ?? 0; const studied = discipline.topicos_estudados ?? 0; const percent = total > 0 ? Math.round((studied / total) * 100) : 0; return <div key={discipline.id}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><Link to={`/disciplinas/${discipline.id}`} className="truncate font-medium hover:underline">{discipline.nome}</Link><span className="shrink-0 text-xs text-muted-foreground">{studied}/{total} · {percent}%</span></div><Progress value={percent} aria-label={`${discipline.nome}: ${percent}% do edital concluído`} /></div>; })}</CardContent></Card> : null}

        {resumoQuery.isError ? <Alert variant="destructive"><RefreshCw aria-hidden="true" /><AlertTitle>Resumo de desempenho indisponível</AlertTitle><AlertDescription>As demais seções continuam funcionando.</AlertDescription></Alert> : <DashboardKpis summary={resumoQuery.data} />}

        <DashboardWeeklySchedule schedule={blocosSemana} today={diaHoje} disciplineNames={discMap} />

        <div className="grid gap-4 lg:grid-cols-2">
          {heatmapQuery.isError ? <Alert variant="destructive"><RefreshCw aria-hidden="true" /><AlertTitle>Constância indisponível</AlertTitle><AlertDescription><Button type="button" variant="outline" size="sm" onClick={() => void heatmapQuery.refetch()}>Tentar novamente</Button></AlertDescription></Alert> : <HeatmapCard data={heatmapQuery.data ?? []} />}
          <CalendarioMensalWidget ano={today.getFullYear()} mes={today.getMonth() + 1} concursoId={concursoAtivoId} />
        </div>

        <Card aria-labelledby="upcoming-notices-title"><CardHeader><CardTitle id="upcoming-notices-title" className="flex items-center gap-2"><Flame className="size-5 text-amber-500" aria-hidden="true" />Avisos próximos</CardTitle><Button asChild variant="ghost" size="sm"><Link to="/avisos">Ver todos</Link></Button></CardHeader><CardContent>{avisosQuery.isError ? <p className="text-sm text-muted-foreground">Não foi possível carregar os avisos.</p> : avisosQuery.data?.length ? <ul className="grid gap-2 sm:grid-cols-2">{avisosQuery.data.slice(0, 4).map((aviso) => <li key={aviso.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><strong className="block">{aviso.titulo}</strong><span className="text-xs text-muted-foreground">{formatNumericDate(aviso.data_vencimento)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum aviso nos próximos 7 dias.</p>}</CardContent></Card>
      </SecondarySection>

      {registroOpen ? (
        <React.Suspense fallback={null}>
          <RegistroEstudoModal open onClose={() => { setRegistroOpen(false); setRegistroPrefill(null); }} defaultDisciplinaId={registroPrefill?.disciplinaId ?? null} defaultConcursoId={concursoAtivoId} defaultTopicos={registroPrefill?.topicoId ? [{ id: registroPrefill.topicoId, nome: "" }] : null} />
        </React.Suspense>
      ) : null}
    </div>
  );
}
