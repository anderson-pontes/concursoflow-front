import { BookOpenCheck, CalendarClock, CalendarDays, CheckCircle2, Clock3, Play, RefreshCw, SquarePen, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildPomodoroLaunchUrlFromStudy } from "@/lib/pomodoro/launchFromCronograma";
import { dashboardStateMessage, type DashboardActionState } from "@/lib/dashboard/presentation";
import { formatStudyDate } from "@/lib/dashboard/dates";
import type { Bloco } from "@/lib/cronograma/types";
import { getTipo } from "@/lib/cronograma/constants";
import { cn } from "@/lib/utils";
import { DashboardCard, DashboardCardHeader, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { DashboardSummaryCard, DashboardSummaryEmpty, DashboardSummaryError, DashboardSummaryLoading } from "@/components/dashboard/DashboardSummaryCard";
import { DashboardSessionStatus } from "@/components/dashboard/DashboardSessionStatus";
import { formatDashboardDuration, type TodaySession } from "@/lib/dashboard/analysis";
import { disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
import { StudyHistoryDetails } from "@/components/estudos/StudyHistoryDetails";

export { DashboardContextHeader, type DashboardContest } from "@/components/dashboard/DashboardContextHeader";

export type NextStudy = {
  fonte?: "cronograma_item" | "bloco_semanal";
  item_id?: string;
  concurso_id?: string;
  disciplina_id: string;
  disciplina_nome: string;
  disciplina_cor?: string | null;
  topico_id: string | null;
  topico_nome: string | null;
  data: string;
  duracao_minutos: number;
  atividade?: string | null;
};

export type PendingReview = {
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string;
  topico_nome: string;
  dias_atraso: number;
};

export type TodayPlanItem = {
  bloco: Bloco;
  disciplina: string;
  minutos: number;
};

export function buildReviewCenterUrl(review: Pick<PendingReview, "dias_atraso">): string {
  const params = new URLSearchParams({
    grupo: review.dias_atraso > 0 ? "atrasadas" : "hoje",
  });
  return `/revisoes?${params.toString()}`;
}

function formatHours(hours: number): string {
  const minutes = Math.max(0, Math.round(hours * 60));
  if (minutes < 60) return `${minutes} min`;
  const fullHours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${fullHours}h ${rest}min` : `${fullHours}h`;
}

export function NextActionCard({
  study,
  studyStatus,
  state,
  isError,
  onRetry,
  onStart,
  onManual,
  registering = false,
  replanUrl,
  concursoId,
  compact = false,
}: {
  study: NextStudy | null | undefined;
  studyStatus?: TodaySession["status"];
  state: Exclude<DashboardActionState, "no_plan" | "empty_plan">;
  isError: boolean;
  onRetry: () => void;
  onStart: () => void;
  onManual: () => void;
  registering?: boolean;
  replanUrl: string;
  concursoId?: string;
  compact?: boolean;
}) {
  const historyDetails = !isError && study && concursoId ? (
    <StudyHistoryDetails key={`${concursoId}:${study.disciplina_id}`}
      concursoId={concursoId} disciplinaId={study.disciplina_id} disciplinaNome={study.disciplina_nome} disciplinaCor={study.disciplina_cor} />
  ) : null;
  const launchUrl = study
    ? buildPomodoroLaunchUrlFromStudy({
        source: "dashboard",
        disciplinaId: study.disciplina_id,
        topicoId: study.topico_id,
        minutos: study.duracao_minutos,
        concursoId: study.concurso_id,
        blocoId: study.fonte === "bloco_semanal" ? study.item_id : undefined,
        itemId: study.fonte === "cronograma_item" ? study.item_id : undefined,
        dataReferencia: study.data,
      })
    : null;

  if (compact) return (
    <DashboardCard aria-labelledby="next-action-title" className="min-w-0 gap-3 border-border bg-card lg:h-auto xl:h-full">
      <DashboardCardHeader>
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-semibold"><h3 id="next-action-title">Próxima sessão</h3></CardTitle>
            <CardDescription>Continue seu planejamento de estudos</CardDescription>
          </div>
          {!isError && study && studyStatus && <DashboardSessionStatus status={studyStatus} />}
        </div>
      </DashboardCardHeader>
      <DashboardCardBody className="gap-3">
        {isError ? (
          <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar a próxima ação. Tente novamente.</p>
        ) : study ? (
          <div className="flex min-w-0 flex-col gap-3 xl:flex-1 xl:justify-center">
            <div style={disciplineColorStyle(study.disciplina_id, study.disciplina_cor)}
              className="min-w-0 space-y-1 rounded-lg border-l-4 bg-[var(--discipline-soft)] px-3.5 py-3 [overflow-wrap:anywhere] dark:bg-[color-mix(in_srgb,var(--discipline-color)_13%,var(--card))]">
              <p className={cn("text-[var(--discipline-on-soft)] dark:text-card-foreground", study.topico_nome ? "text-sm font-medium" : "text-base font-semibold")}>{study.disciplina_nome}</p>
              {study.topico_nome && <p className="text-base font-semibold leading-snug text-card-foreground">{study.topico_nome}</p>}
            </div>
            <dl className={cn("grid grid-cols-2 gap-2", study.atividade && "sm:grid-cols-3")}>
              <div className="min-w-0 rounded-lg bg-muted/50 px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden /> Data prevista</dt>
                <dd className="mt-1 text-sm font-semibold"><time dateTime={study.data}>{formatStudyDate(study.data)}</time></dd>
              </div>
              <div className="min-w-0 rounded-lg bg-muted/50 px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden /> Duração</dt>
                <dd className="mt-1 text-sm font-semibold">{formatDashboardDuration(study.duracao_minutos)}</dd>
              </div>
              {study.atividade && <div className="col-span-2 min-w-0 rounded-lg bg-muted/50 px-3 py-2.5 sm:col-span-1">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Target className="size-3.5" aria-hidden /> Atividade</dt>
                <dd className="mt-1 break-words text-sm font-semibold">{getTipo(study.atividade).label}</dd>
              </div>}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Planejamento concluído por enquanto. Ajuste o cronograma para receber uma nova recomendação.</p>
        )}
        <div className="space-y-2">
          <div className={cn("grid gap-2", launchUrl && study && "sm:grid-cols-2")}>
            {isError && <Button type="button" onClick={onRetry}>Tentar novamente</Button>}
            {launchUrl && <Button asChild className="min-h-11 w-full active:brightness-90"><Link to={launchUrl} onClick={onStart}><Play aria-hidden /> Iniciar estudo</Link></Button>}
            {study && <Button type="button" variant="outline" className="min-h-11 w-full" onClick={onManual} disabled={registering} aria-busy={registering}>
              <SquarePen aria-hidden /> {registering ? "Abrindo registro…" : "Registrar manualmente"}
            </Button>}
          </div>
          <div className={cn("grid gap-2 border-t border-border pt-1 [&>button]:w-full", historyDetails && "grid-cols-2")}>
            {historyDetails}
            <Button asChild variant="ghost" size="sm" className={cn("min-h-11 px-2", !historyDetails && "justify-self-end")}><Link to={replanUrl}><RefreshCw aria-hidden /> Replanejar</Link></Button>
          </div>
        </div>
      </DashboardCardBody>
    </DashboardCard>
  );

  return (
    <Card className="border-border bg-card" aria-labelledby="next-action-title">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{compact ? "Próxima sessão" : "Próxima ação"}</p>
          <CardTitle className="mt-1 text-xl font-bold">
            <h2 id="next-action-title">
            {isError ? "Não foi possível carregar a próxima ação" : study?.disciplina_nome ?? "Planejamento concluído por enquanto"}
            </h2>
          </CardTitle>
          <CardDescription className="mt-1">
            {isError
              ? "O restante do painel continua disponível. Tente carregar esta seção novamente."
              : study
                ? `${study.topico_nome ? `${study.topico_nome} · ` : ""}${formatStudyDate(study.data)} · ${study.duracao_minutos} min`
                : "Ajuste o cronograma para receber uma nova recomendação."}
          </CardDescription>
        </div>
        {state === "completed" ? <Trophy className="size-6 text-primary" aria-hidden="true" /> : null}
      </CardHeader>
      <CardContent>
        {!isError && !compact ? <p className="mb-4 text-sm text-muted-foreground">{dashboardStateMessage[state]}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isError ? <Button type="button" onClick={onRetry}>Tentar novamente</Button> : null}
          {launchUrl ? <Button asChild><Link to={launchUrl} onClick={onStart}><Play aria-hidden="true" /> Iniciar estudo</Link></Button> : null}
          {study ? <Button type="button" variant="outline" onClick={onManual}>Registrar manualmente</Button> : null}
          {historyDetails}
          <Button asChild variant="outline"><Link to={replanUrl}><RefreshCw aria-hidden="true" /> Replanejar</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TodayPlanCard({ items, onRegister }: { items: TodayPlanItem[]; onRegister: (item: TodayPlanItem) => void }) {
  return (
    <Card aria-labelledby="today-plan-title">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" aria-hidden="true" /><h2 id="today-plan-title">Plano de hoje</h2></CardTitle>
          <CardDescription>Sessões previstas no cronograma semanal</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm"><Link to="/cronograma">Ver cronograma</Link></Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Nenhum bloco planejado para hoje</p>
            <p className="mt-1 text-sm text-muted-foreground">Você pode consultar a semana ou registrar um estudo livre.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {items.map((item) => (
              <li key={item.bloco.id}>
                <Button type="button" variant="outline" onClick={() => onRegister(item)} className="h-auto min-h-12 w-full justify-start whitespace-normal px-3 py-2 text-left">
                  <Clock3 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{item.disciplina}</strong>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{item.bloco.topico_nome ?? "Disciplina"} · {item.bloco.hora_inicio}–{item.bloco.hora_fim} · {item.minutos} min</span>
                  </span>
                </Button>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyGoalCard({ hours, goalHours, questions, isError, onRetry }: { hours: number; goalHours: number; questions: number; isError: boolean; onRetry: () => void }) {
  const percent = goalHours > 0 ? Math.min(100, Math.round((hours / goalHours) * 100)) : 0;
  return (
    <Card aria-labelledby="weekly-goal-title">
      <CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" aria-hidden="true" /><h2 id="weekly-goal-title">Meta semanal</h2></CardTitle></CardHeader>
      <CardContent>
        {isError ? <div><p className="text-sm text-muted-foreground">Não foi possível carregar a meta.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tentar novamente</Button></div> : <>
          <div className="flex items-end justify-between gap-3"><p><strong className="text-2xl">{formatHours(hours)}</strong><span className="ml-2 text-sm text-muted-foreground">de {formatHours(goalHours)}</span></p><span className="text-sm font-semibold text-primary">{percent}%</span></div>
          <Progress className="mt-3 h-2" value={percent} aria-label={`${percent}% da meta semanal concluída`} />
          <p className="mt-3 text-sm text-muted-foreground">{questions} questões respondidas nos últimos 7 dias.</p>
        </>}
      </CardContent>
    </Card>
  );
}

export function UrgentReviewsCard({ reviews, total, isError, isLoading = false, onRetry }: {
  reviews: PendingReview[]; total: number; isError: boolean; isLoading?: boolean; onRetry: () => void;
}) {
  const overdue = reviews.filter(review => review.dias_atraso > 0).length;
  const overviewUrl = buildReviewCenterUrl({ dias_atraso: overdue });
  return <DashboardSummaryCard title="Revisões urgentes" description="Revisões previstas e em atraso" icon={BookOpenCheck} tone="coral"
    count={isError || isLoading ? undefined : total} action={{ label: "Ver todas", to: overviewUrl }}>
    {isError ? <DashboardSummaryError message="Não foi possível carregar as revisões." onRetry={onRetry} />
      : isLoading ? <DashboardSummaryLoading />
      : total === 0 ? <DashboardSummaryEmpty icon={CheckCircle2} title="Nenhuma revisão urgente no concurso ativo"
        description="As revisões previstas estão em dia." />
      : <div className="space-y-2">
        {reviews.length === total && <div className="flex flex-wrap gap-1.5 text-xs font-medium tabular-nums">
          <span className="rounded-md border border-border bg-card px-2 py-1">Hoje · {total - overdue}</span>
          <span className="dashboard-summary-count rounded-md px-2 py-1">Em atraso · {overdue}</span>
        </div>}
        <ul aria-label="Próximas revisões" className="space-y-1.5">
          {reviews.slice(0, 3).map(review => <li key={review.topico_id} className="dashboard-summary-panel flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{review.topico_nome}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs leading-snug">
                <p className="text-muted-foreground [overflow-wrap:anywhere]">{review.disciplina_nome}</p>
                <p className={`font-medium ${review.dias_atraso > 0 ? "text-[color:var(--soft-ink)]" : "text-muted-foreground"}`}>
                  {review.dias_atraso > 0 ? `${review.dias_atraso} ${review.dias_atraso === 1 ? "dia" : "dias"} em atraso` : "Prevista para hoje"}
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to={buildReviewCenterUrl(review)}>Revisar</Link>
            </Button>
          </li>)}
        </ul>
        {total > 3 && <p className="text-xs text-muted-foreground">Mostrando {Math.min(reviews.length, 3)} de {total} revisões</p>}
      </div>}
  </DashboardSummaryCard>;
}
export function SecondarySection({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section aria-labelledby="secondary-dashboard-title" className={cn("space-y-4", className)}><div><h2 id="secondary-dashboard-title" className="text-lg font-semibold">Visão complementar</h2><p className="text-sm text-muted-foreground">Progresso, constância e calendário para consulta.</p></div>{children}</section>;
}
