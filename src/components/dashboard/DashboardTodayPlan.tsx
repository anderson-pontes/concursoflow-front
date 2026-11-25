import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarCheck, Check, ChevronRight, Clock3, SquarePen } from "lucide-react";

import { DashboardCard, DashboardCardBody, DashboardCardHeader } from "@/components/dashboard/DashboardCard";
import { DashboardSessionStatus } from "@/components/dashboard/DashboardSessionStatus";
import { DisciplineColorIndicator, disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
import { StudyHistoryDetails } from "@/components/estudos/StudyHistoryDetails";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDashboardDuration, type TodaySession } from "@/lib/dashboard/analysis";
import { cn } from "@/lib/utils";
import "./dashboard-today-plan.css";

const statuses = {
  em_andamento: { surface: "border-info/25 border-l-info bg-info/5", priority: 0 },
  atrasada: { surface: "border-warning/25 border-l-warning bg-warning/5", priority: 1 },
  planejada: { surface: "border-primary/20 border-l-primary bg-primary/5", priority: 2 },
  concluida: { surface: "border-success/25 border-l-success bg-success/5", priority: 3 },
} as const;

const previewLimit = 2;
const longTopicLength = 100;
const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

type Props = {
  items: TodaySession[];
  onRegister: (item: TodaySession) => void;
  concursoId?: string;
  day?: string;
  studiedMinutes?: number;
  error?: boolean;
  retry?: () => void;
};

export function DashboardTodayPlan({ items, onRegister, concursoId, day, studiedMinutes, error = false, retry }: Props) {
  const [showAll, setShowAll] = useState(false);
  const pendingRegistration = useRef<TodaySession | null>(null);
  const drawerTitle = useRef<HTMLHeadingElement>(null);
  const date = day ?? items[0]?.data;
  const dateLabel = date ? dayFormat.format(new Date(`${date}T12:00:00Z`)) : null;
  const chronological = [...items].sort((a, b) => (a.hora_inicio ?? "99:99").localeCompare(b.hora_inicio ?? "99:99"));
  const hasMore = chronological.length > previewLimit;
  const preview = hasMore
    ? [...chronological].sort((a, b) => statuses[a.status].priority - statuses[b.status].priority).slice(0, previewLimit)
    : chronological;
  const hasLongTopic = preview.some((item) => (item.topico_nome?.length ?? 0) > longTopicLength);
  const completed = items.filter((item) => item.status === "concluida").length;
  const plannedMinutes = items.reduce((total, item) => total + item.duracao_minutos, 0);
  const sessionCount = `${items.length} ${items.length === 1 ? "sessão" : "sessões"}`;

  return (
    <DashboardCard aria-labelledby="today-plan-heading" className="gap-3 [container-type:inline-size] lg:h-auto xl:h-full">
      <DashboardCardHeader>
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarCheck className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-semibold"><h3 id="today-plan-heading">Plano de hoje</h3></CardTitle>
            {dateLabel && <CardDescription><time dateTime={date}>{dateLabel}</time></CardDescription>}
          </div>
          <Button asChild variant="ghost" size="sm" className="min-h-11 px-1 text-primary">
            <Link to="/cronograma">Ver cronograma <ArrowUpRight aria-hidden /></Link>
          </Button>
        </div>
      </DashboardCardHeader>
      <DashboardCardBody className="gap-2">
        {error ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-muted-foreground">Plano do dia indisponível.</p>
            <Button variant="outline" size="sm" onClick={retry}>Tentar novamente</Button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            Nenhuma sessão planejada para hoje. Use o cronograma para organizar seus estudos.
          </p>
        ) : (
          <>
            <DailyProgress completed={completed} total={items.length} plannedMinutes={plannedMinutes} studiedMinutes={studiedMinutes} />
            <ul aria-label={hasMore ? "Sessões prioritárias" : "Sessões planejadas"}
              className={cn("grid min-w-0 gap-2", hasMore && "dashboard-today-priority-grid")}>
              {preview.map((item) => <SessionItem key={`${item.fonte}-${item.id}`} item={item} concursoId={concursoId} onRegister={onRegister} preview />)}
            </ul>
            {(hasMore || hasLongTopic) && (
              <Sheet open={showAll} onOpenChange={setShowAll}>
                <div className="flex flex-wrap items-center justify-between gap-x-2 border-t border-border text-xs text-muted-foreground">
                  {hasMore && <span>Sessões prioritárias · {preview.length} de {sessionCount}</span>}
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto min-h-11 px-1 text-primary lg:h-8 lg:min-h-8">
                      Ver todas as sessões <ChevronRight aria-hidden />
                    </Button>
                  </SheetTrigger>
                </div>
                <SheetContent className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden border-l-0 p-0 sm:max-w-none md:w-[min(100%,36rem)] md:border-l [&>button]:grid [&>button]:size-11 [&>button]:place-items-center"
                  onOpenAutoFocus={(event) => { event.preventDefault(); drawerTitle.current?.focus(); }}
                  onCloseAutoFocus={() => {
                    const item = pendingRegistration.current;
                    pendingRegistration.current = null;
                    if (item) onRegister(item);
                  }}>
                  <header className="shrink-0 space-y-1.5 border-b border-border bg-card py-4 pl-4 pr-16 sm:pl-6">
                    <SheetTitle ref={drawerTitle} tabIndex={-1} className="text-xl outline-none">Sessões de hoje</SheetTitle>
                    <SheetDescription>{dateLabel && `${dateLabel} · `}{sessionCount}</SheetDescription>
                  </header>
                  <div role="region" aria-label="Planejamento completo do dia" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    <ol className="space-y-2">
                      {chronological.map((item) => (
                        <SessionItem key={`${item.fonte}-${item.id}`} item={item} concursoId={concursoId} onRegister={(selected) => {
                          pendingRegistration.current = selected;
                          setShowAll(false);
                        }} />
                      ))}
                    </ol>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </>
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
}

function DailyProgress({ completed, total, plannedMinutes, studiedMinutes }: {
  completed: number;
  total: number;
  plannedMinutes: number;
  studiedMinutes?: number;
}) {
  const complete = completed === total;
  const percent = complete ? 100 : Math.min(99, Math.round(completed / total * 100));
  const completion = `${completed} de ${total} sessões concluídas`;
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>Progresso diário</span>
        <span className={cn("text-lg leading-none tabular-nums", complete ? "text-success-text" : "text-primary")}>{percent}%</span>
      </div>
      <Progress value={percent} aria-label={completion}
        className={cn("h-2 rounded-full bg-border motion-reduce:[&_[data-slot=progress-indicator]]:transition-none [&_[data-slot=progress-indicator]]:rounded-full", complete && "[&_[data-slot=progress-indicator]]:bg-success")} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {complete && <Check className="size-3.5 text-success-text" aria-hidden />}
          {complete ? `Plano do dia concluído · ${completed}/${total} sessões` : completion}
        </span>
        <span className="tabular-nums">
          {studiedMinutes !== undefined && `${formatDashboardDuration(studiedMinutes)} estudados de `}
          {formatDashboardDuration(plannedMinutes)} planejados
        </span>
      </div>
    </div>
  );
}

function SessionItem({ item, concursoId, onRegister, preview = false }: {
  item: TodaySession;
  concursoId?: string;
  onRegister: Props["onRegister"];
  preview?: boolean;
}) {
  const status = statuses[item.status];
  return (
    <li className={cn("flex min-w-0 flex-col gap-1.5 rounded-lg border border-l-[3px] px-3 py-2", status.surface)}>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <p style={disciplineColorStyle(item.disciplina_id, item.disciplina_cor)}
          className="flex min-w-[min(100%,8rem)] flex-1 items-baseline gap-1.5 text-sm font-medium text-[color-mix(in_srgb,var(--card-foreground)_78%,var(--discipline-color))] [overflow-wrap:anywhere]">
          <DisciplineColorIndicator disciplinaId={item.disciplina_id} shape="dot" customColor={item.disciplina_cor} />
          {item.disciplina_nome}
        </p>
        <div className="ml-auto"><DashboardSessionStatus status={item.status} /></div>
      </div>
      {item.topico_nome && (
        <p className={cn("text-sm font-semibold leading-snug [overflow-wrap:anywhere]", preview && item.topico_nome.length > longTopicLength && "line-clamp-2")}>
          {item.topico_nome}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2">
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden />
          {item.hora_inicio ?? "Sem horário"}{item.hora_inicio && item.hora_fim && `–${item.hora_fim}`} · {formatDashboardDuration(item.duracao_minutos)}
        </span>
        <div className="ml-auto flex flex-wrap items-center justify-end">
          {concursoId && <StudyHistoryDetails key={`${concursoId}:${item.disciplina_id}`} compact
            concursoId={concursoId} disciplinaId={item.disciplina_id} disciplinaNome={item.disciplina_nome} disciplinaCor={item.disciplina_cor} />}
          <Button variant="ghost" size="sm" className="min-h-11 px-2 text-primary lg:h-8 lg:min-h-8" aria-label="Registrar estudo" onClick={() => onRegister(item)}>
            <SquarePen aria-hidden /> Registrar
          </Button>
        </div>
      </div>
    </li>
  );
}
