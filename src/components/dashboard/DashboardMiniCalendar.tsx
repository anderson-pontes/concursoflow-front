import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DisciplineColorIndicator } from "@/components/disciplinas/DisciplineColorIndicator";
import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { fmtDuracaoCalendario, fmtMesAno } from "@/lib/calendario/format";
import type { CalendarioDia, DiaDetalheResponse } from "@/lib/calendario/types";
import { calendarioHref } from "@/lib/calendario/urlParams";
import { fmtDateBR } from "@/lib/cronograma/types";
import { dashboardDayISO } from "@/lib/dashboard/analysis";
import { fetchDiaDetalhe } from "@/services/calendario";
import { ActivityCardHeader } from "./ActivityCardHeader";

type Disciplines = ReadonlyMap<string, { nome: string; cor_hex?: string | null }>;
const weekdays = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function monthOf(iso: string) {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

function PlannedMarker() {
  return <span className="activity-plan-marker" aria-hidden="true" />;
}

function CalendarLegend() {
  return <ul aria-label="Legenda do mini calendário" className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
    <li><PlannedMarker />Planejado</li>
    <li><CircleCheck className="size-3.5 text-success-text" aria-hidden="true" />Registrado</li>
    <li><RefreshCw className="activity-review-icon size-3.5" aria-hidden="true" />Revisão</li>
    <li><span className="activity-legend-today" aria-hidden="true" />Hoje</li>
    <li><span className="activity-legend-selected" aria-hidden="true" />Selecionado</li>
  </ul>;
}

function CalendarDay({ date, number, day, today, selected, disciplines, onSelect }: {
  date: string; number: number; day?: CalendarioDia; today: boolean; selected: boolean;
  disciplines?: Disciplines; onSelect: (date: string) => void;
}) {
  const planned = [...new Map(day?.planejado.map(item => [item.disciplina_id, item.disciplina_nome])).entries()];
  const registered = Boolean(day?.sessoes_realizadas || day?.minutos_realizados);
  const review = day?.planejado.some(item => item.modo === "revisao");
  const label = [
    fmtDateBR(date), today && "hoje", planned.length > 0 && "planejado: " + planned.map(([, name]) => name).join(", "),
    registered && "estudo registrado", review && "revisão programada",
  ].filter(Boolean).join(", ");
  return <button type="button" aria-label={label} title={label} aria-current={today ? "date" : undefined}
    aria-pressed={selected} data-active={Boolean(planned.length || registered)} className="activity-calendar-day" onClick={() => onSelect(date)}>
    <span>{number}</span>
    <span className="activity-calendar-markers" aria-hidden="true">
      {planned.slice(0, 2).map(([id, name]) => <DisciplineColorIndicator key={id} disciplinaId={id} shape="dot" className="size-1.5" label={name} customColor={disciplines?.get(id)?.cor_hex} />)}
      {planned.length > 2 && <span className="activity-calendar-overflow">+{planned.length - 2}</span>}
      {registered && <CircleCheck className="size-3 shrink-0 text-success-text" />}
      {review && <RefreshCw className="activity-review-icon size-3 shrink-0" />}
    </span>
  </button>;
}

function SelectedDaySummary({ date, day, detail, loading, error, retry, href, disciplines, timezone }: {
  date: string; day?: CalendarioDia; detail?: DiaDetalheResponse; loading: boolean; error: boolean;
  retry: () => void; href: string; disciplines?: Disciplines; timezone: string;
}) {
  const planned = detail?.planejado ?? day?.planejado ?? [];
  const registered = detail?.realizado ?? [];
  const regular = planned.filter(item => item.modo !== "revisao");
  const reviews = planned.length - regular.length;
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: timezone });
  const activities = [
    ...planned.map(item => ({
      key: item.fonte + "-" + item.id,
      id: item.disciplina_id, name: item.disciplina_nome, topic: item.topico_nome,
      duration: item.duracao_minutos, status: item.modo === "revisao" ? "Revisão" : "Planejada", time: null,
    })),
    ...registered.map(item => {
      const match = planned.find(row => row.disciplina_id === item.disciplina_id && row.topico_id === item.topico_id);
      const started = new Date(item.inicio);
      return {
        key: item.id, id: item.disciplina_id,
        name: disciplines?.get(item.disciplina_id)?.nome ?? planned.find(row => row.disciplina_id === item.disciplina_id)?.disciplina_nome ?? "Estudo registrado",
        topic: match?.topico_nome, duration: Number.isFinite(item.tempo_estudo_segundos) ? item.tempo_estudo_segundos / 60 : item.duracao_minutos,
        status: "Realizada", time: Number.isFinite(started.getTime()) ? time.format(started) : null,
      };
    }),
  ];

  return <div className="activity-day-summary space-y-2 rounded-xl text-xs">
    <h3 className="font-semibold">Sessões de {fmtDateBR(date)}</h3>
    <div className="flex flex-wrap gap-1.5" aria-label="Totais de atividades do dia">
      <span className="activity-summary-chip"><PlannedMarker />{regular.length} {regular.length === 1 ? "planejada" : "planejadas"}</span>
      <span className="activity-summary-chip"><CircleCheck className="size-3.5 text-success-text" aria-hidden="true" />{day?.sessoes_realizadas ?? registered.length} {(day?.sessoes_realizadas ?? registered.length) === 1 ? "realizada" : "realizadas"}</span>
      <span className="activity-summary-chip"><RefreshCw className="activity-review-icon size-3.5" aria-hidden="true" />{reviews} {reviews === 1 ? "revisão" : "revisões"}</span>
    </div>
    {loading ? <Skeleton className="h-12" aria-label="Carregando sessões do dia" />
      : error ? <div role="alert" className="space-y-2"><p>Não foi possível carregar as sessões deste dia.</p><Button variant="outline" size="sm" onClick={retry}>Tentar novamente</Button></div>
      : activities.length ? <>
        <ul className="grid gap-1.5" aria-label="Sessões do dia selecionado">
          {activities.slice(0, 2).map(item => <li key={item.key} className="activity-day-item flex min-w-0 items-center gap-2 rounded-lg">
            <DisciplineColorIndicator disciplinaId={item.id} customColor={disciplines?.get(item.id)?.cor_hex} className="h-6" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" title={item.name}>{item.name}</p>
              <p className="truncate text-muted-foreground" title={item.topic ?? undefined}>
                {[item.status, item.time, item.topic].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="shrink-0 tabular-nums">{fmtDuracaoCalendario(item.duration)}</span>
          </li>)}
        </ul>
        {activities.length > 2 && <Link to={href} className="activity-link">Ver todas as atividades do dia <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>}
      </> : <p className="text-muted-foreground">Nenhuma atividade planejada ou registrada para este dia. <Link to="/cronograma" className="activity-link">Planejar estudos</Link></p>}
  </div>;
}

/** O mês e a seleção têm cache próprio, independente do período de análise. */
export function DashboardMiniCalendar({ concursoId, disciplines, timezone = "America/Sao_Paulo" }: {
  concursoId: string | null; disciplines?: Disciplines; timezone?: string;
}) {
  const heading = useId();
  const [month, setMonth] = useState(() => monthOf(dashboardDayISO(timezone)));
  const [selection, setSelection] = useState<{ date: string; contest: string | null }>();
  const selected = selection?.contest === concursoId ? selection?.date : undefined;
  const calendar = useCalendarioMensal(month.year, month.month, concursoId);
  const [resolvedTimezone, setResolvedTimezone] = useState(timezone);
  const today = dashboardDayISO(resolvedTimezone);
  const [previousTimezone, setPreviousTimezone] = useState(timezone);
  const calendarTimezone = calendar.calendario?.timezone;
  useEffect(() => { setResolvedTimezone(timezone); }, [timezone]);
  useEffect(() => { if (calendarTimezone) setResolvedTimezone(calendarTimezone); }, [calendarTimezone]);
  // When the configured timezone changes, return to that timezone's current day.
  useEffect(() => {
    if (resolvedTimezone === previousTimezone) return;
    setPreviousTimezone(resolvedTimezone);
    setMonth(monthOf(today));
    setSelection({ date: today, contest: concursoId });
  }, [concursoId, previousTimezone, resolvedTimezone, today]);
  // Clear a previous contest's selection even if the user later returns to it.
  useEffect(() => { setSelection(current => current?.contest === concursoId ? current : undefined); }, [concursoId]);

  const detail = useQuery({
    queryKey: ["calendario-dia", selected, concursoId],
    queryFn: () => fetchDiaDetalhe({ data: selected!, concursoId }),
    enabled: Boolean(concursoId && selected) && !calendar.isLoading && !calendar.isError,
    staleTime: 60_000,
  });
  const rows = new Map(calendar.dias.map(day => [day.data, day]));
  const last = new Date(month.year, month.month, 0).getDate();
  const offset = (new Date(month.year, month.month - 1, 1).getDay() + 6) % 7;
  const fullCalendar = calendarioHref(month.year, month.month, selected);

  function shift(delta: number) {
    const date = new Date(month.year, month.month - 1 + delta, 1);
    setMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
    setSelection(undefined);
  }

  function goToday() {
    setMonth(monthOf(today));
    setSelection({ date: today, contest: concursoId });
  }

  return <section data-slot="card" className="dashboard-analytics-card dashboard-activity-card" data-tone="blue" aria-labelledby={heading}>
    <ActivityCardHeader id={heading} Icon={CalendarDays} title="Mini calendário" description="Organize suas próximas atividades">
      <Link to={fullCalendar} className="activity-link activity-calendar-link">Ver calendário completo <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
    </ActivityCardHeader>
    {!concursoId ? <p className="text-sm text-muted-foreground">Selecione um concurso para consultar o calendário.</p> : <>
      <div className="activity-surface activity-calendar-surface rounded-xl">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold tracking-tight" aria-live="polite">{fmtMesAno(month.year, month.month)}</p>
          <div className="activity-nav inline-flex items-center gap-1 rounded-xl" role="group" aria-label="Navegação do mini calendário">
            <Button variant="ghost" className="activity-control" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior"><ChevronLeft /></Button>
            <Button variant="ghost" className="activity-control" size="sm" onClick={goToday}>Hoje</Button>
            <Button variant="ghost" className="activity-control" size="icon" onClick={() => shift(1)} aria-label="Próximo mês"><ChevronRight /></Button>
          </div>
        </div>
        <div className="activity-calendar-weekdays grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground" aria-hidden="true">
          {weekdays.map(day => <span key={day} className="pb-1.5">{day}</span>)}
        </div>
        {calendar.isLoading ? <div className="activity-calendar-grid" aria-label="Carregando mini calendário">
          {Array.from({ length: 42 }, (_, i) => <Skeleton key={i} className="activity-calendar-day" />)}
        </div> : calendar.isError ? <div role="alert" className="space-y-2 py-4 text-sm">
          <p>Não foi possível carregar o calendário.</p><Button variant="outline" size="sm" onClick={() => void calendar.refetch()}>Tentar novamente</Button>
        </div> : <div className="activity-calendar-grid" role="group" aria-label="Dias do mini calendário">
          {Array.from({ length: 42 }, (_, index) => {
            const number = index - offset + 1;
            const date = new Date(month.year, month.month - 1, number, 12);
            if (number < 1 || number > last) return <span key={index} aria-hidden="true" className="activity-calendar-day activity-calendar-outside">{date.getDate()}</span>;
            const iso = String(month.year) + "-" + String(month.month).padStart(2, "0") + "-" + String(number).padStart(2, "0");
            return <CalendarDay key={iso} date={iso} number={number} day={rows.get(iso)} today={iso === today} selected={iso === selected}
              disciplines={disciplines} onSelect={date => setSelection({ date, contest: concursoId })} />;
          })}
        </div>}
      </div>
      {!calendar.isLoading && !calendar.isError && <footer className="activity-card-footer space-y-3">
        <CalendarLegend />
        {selected ? <SelectedDaySummary date={selected} day={rows.get(selected)} detail={detail.data} loading={detail.isLoading}
          error={detail.isError} retry={() => void detail.refetch()} href={fullCalendar} disciplines={disciplines} timezone={resolvedTimezone} />
          : <p className="text-xs text-muted-foreground">Selecione um dia para consultar suas atividades.</p>}
      </footer>}
    </>}
  </section>;
}
