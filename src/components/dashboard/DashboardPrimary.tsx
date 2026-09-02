import { BookOpenCheck, CheckCircle2, Clock3, Play, RefreshCw, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildPomodoroLaunchUrlFromStudy } from "@/lib/pomodoro/launchFromCronograma";
import { dashboardStateMessage, type DashboardActionState } from "@/lib/dashboard/presentation";
import { formatExamDate, formatStudyDate } from "@/lib/dashboard/dates";
import type { Bloco } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

export type DashboardContest = {
  nome: string;
  orgao: string;
  cargo: string | null;
  data_prova: string | null;
};

export type NextStudy = {
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string | null;
  topico_nome: string | null;
  data: string;
  duracao_minutos: number;
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

function formatHours(hours: number): string {
  const minutes = Math.max(0, Math.round(hours * 60));
  if (minutes < 60) return `${minutes} min`;
  const fullHours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${fullHours}h ${rest}min` : `${fullHours}h`;
}

export function DashboardContextHeader({ contest, daysUntilExam }: { contest: DashboardContest; daysUntilExam: number | null }) {
  const examLabel = daysUntilExam === null
    ? "Data da prova ainda não informada"
    : daysUntilExam > 0
      ? `${daysUntilExam} dias para a prova`
      : daysUntilExam === 0
        ? "A prova é hoje"
        : `Prova realizada há ${Math.abs(daysUntilExam)} dias`;

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Concurso ativo</p>
        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">{contest.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{contest.orgao}{contest.cargo ? ` · ${contest.cargo}` : ""}</p>
      </div>
      <Badge variant="outline" className="h-auto min-h-10 max-w-full flex-wrap justify-start whitespace-normal px-3 py-2 text-sm sm:justify-center">
        <Target aria-hidden="true" />
        {examLabel}
        {contest.data_prova ? <span className="font-normal text-muted-foreground">· {formatExamDate(contest.data_prova)}</span> : null}
      </Badge>
    </header>
  );
}

export function NextActionCard({
  study,
  state,
  isError,
  onRetry,
  onStart,
  onManual,
  replanUrl,
}: {
  study: NextStudy | null | undefined;
  state: Exclude<DashboardActionState, "no_plan" | "empty_plan">;
  isError: boolean;
  onRetry: () => void;
  onStart: () => void;
  onManual: () => void;
  replanUrl: string;
}) {
  const launchUrl = study
    ? buildPomodoroLaunchUrlFromStudy({
        source: "dashboard",
        disciplinaId: study.disciplina_id,
        topicoId: study.topico_id,
        minutos: study.duracao_minutos,
      })
    : null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card" aria-labelledby="next-action-title">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próxima ação</p>
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
        {!isError ? <p className="mb-4 text-sm text-muted-foreground">{dashboardStateMessage[state]}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isError ? <Button type="button" onClick={onRetry}>Tentar novamente</Button> : null}
          {launchUrl ? <Button asChild><Link to={launchUrl} onClick={onStart}><Play aria-hidden="true" /> Iniciar estudo</Link></Button> : null}
          {study ? <Button type="button" variant="outline" onClick={onManual}>Registrar manualmente</Button> : null}
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

export function UrgentReviewsCard({ reviews, total, isError, onRetry }: { reviews: PendingReview[]; total: number; isError: boolean; onRetry: () => void }) {
  return (
    <Card aria-labelledby="urgent-reviews-title">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" aria-hidden="true" /><h2 id="urgent-reviews-title">Revisões urgentes</h2></CardTitle>
        <Badge variant="secondary">{total}</Badge>
      </CardHeader>
      <CardContent>
        {isError ? <div><p className="text-sm text-muted-foreground">Não foi possível carregar as revisões.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tentar novamente</Button></div> : reviews.length ? <ul className="divide-y divide-border">{reviews.slice(0, 3).map((review) => <li key={review.topico_id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{review.topico_nome}</strong><span className="text-xs text-muted-foreground">{review.disciplina_nome}{review.dias_atraso > 0 ? ` · ${review.dias_atraso} dia(s) em atraso` : " · revisar hoje"}</span></div><Button asChild size="sm" variant="outline"><Link to={`/disciplinas/${review.disciplina_id}?topico=${review.topico_id}`}>Revisar</Link></Button></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma revisão urgente no concurso ativo.</p>}
      </CardContent>
    </Card>
  );
}

export function SecondarySection({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section aria-labelledby="secondary-dashboard-title" className={cn("space-y-4", className)}><div><h2 id="secondary-dashboard-title" className="text-lg font-semibold">Visão complementar</h2><p className="text-sm text-muted-foreground">Progresso, constância e calendário para consulta.</p></div>{children}</section>;
}
