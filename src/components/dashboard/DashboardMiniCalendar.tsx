import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Check, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisciplinaColor, getDisciplinaPalette } from "@/components/disciplinas/disciplinaPalettes";
import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { fmtMesAno } from "@/lib/calendario/format";
import { calendarioHref } from "@/lib/calendario/urlParams";
import { fmtDateBR } from "@/lib/cronograma/types";
import { dashboardDayISO } from "@/lib/dashboard/analysis";
import { fetchDiaDetalhe } from "@/services/calendario";
import { cn } from "@/lib/utils";

function duration(minutes: number) {
  if (!Number.isFinite(minutes)) return "Tempo indisponível";
  const total = Math.max(0, Math.round(minutes));
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}min` : ""}`;
}

/** Mês e seleção independentes do filtro de período dos gráficos. */
export function DashboardMiniCalendar({ concursoId, disciplineNames, timezone = "America/Sao_Paulo" }: { concursoId: string | null; disciplineNames?: ReadonlyMap<string, string>; timezone?: string }) {
  const [resolvedTimezone, setResolvedTimezone] = React.useState(timezone);
  const today = dashboardDayISO(resolvedTimezone);
  const [month, setMonth] = React.useState(() => { const iso = dashboardDayISO(timezone); return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) }; });
  const [selected, setSelected] = React.useState<string | null>(today);
  const calendar = useCalendarioMensal(month.year, month.month, concursoId);
  const previousTimezone = React.useRef(resolvedTimezone);
  React.useEffect(() => { setResolvedTimezone(timezone); }, [timezone]);
  React.useEffect(() => { if (calendar.calendario?.timezone) setResolvedTimezone(calendar.calendario.timezone); }, [calendar.calendario?.timezone]);
  React.useEffect(() => {
    if (previousTimezone.current === resolvedTimezone) return;
    previousTimezone.current = resolvedTimezone;
    const iso = dashboardDayISO(resolvedTimezone);
    setMonth({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });
    setSelected(iso);
  }, [resolvedTimezone]);
  const detail = useQuery({
    queryKey: ["calendario-dia", selected, concursoId],
    queryFn: () => fetchDiaDetalhe({ data: selected!, concursoId }),
    enabled: Boolean(concursoId && selected) && !calendar.isLoading && !calendar.isError,
    staleTime: 60_000,
  });
  React.useEffect(() => { setSelected(null); }, [concursoId]);
  const rows = new Map(calendar.dias.map(day => [day.data, day]));
  const count = new Date(month.year, month.month, 0).getDate();
  const offset = (new Date(month.year, month.month - 1, 1).getDay() + 6) % 7;
  const cellCount = Math.ceil((offset + count) / 7) * 7;
  function shift(delta: number) {
    const date = new Date(month.year, month.month - 1 + delta, 1);
    setMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
    setSelected(null);
  }
  function goToday() {
    const iso = dashboardDayISO(resolvedTimezone);
    setMonth({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });
    setSelected(iso);
  }
  const selectedDay = selected ? rows.get(selected) : undefined;
  const planned = detail.data?.planejado ?? selectedDay?.planejado ?? [];
  const real = detail.data?.realizado ?? [];
  const names = new Map([...(disciplineNames ?? []), ...calendar.dias.flatMap(day => day.planejado.map(item => [item.disciplina_id, item.disciplina_nome] as const))]);
  const selectedLoading = Boolean(selected) && detail.isLoading;
  return <section className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm lg:h-full" aria-labelledby="dashboard-mini-calendar-title">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><h2 id="dashboard-mini-calendar-title" className="flex items-center gap-2 text-base font-medium"><CalendarDays className="size-4 text-primary" aria-hidden="true" />Mini calendário</h2><Link to={calendarioHref(month.year, month.month, selected)} className="inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline">Ver calendário completo</Link></div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold" aria-live="polite">{fmtMesAno(month.year, month.month)}</p><div className="flex gap-1" role="group" aria-label="Navegação do mini calendário"><Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior"><ChevronLeft /></Button><Button variant="outline" size="sm" onClick={goToday}>Hoje</Button><Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo mês"><ChevronRight /></Button></div></div>
    {!concursoId ? <p className="py-4 text-sm text-muted-foreground">Selecione um concurso para consultar o calendário.</p> : calendar.isLoading ? <Skeleton className="h-64 w-full" aria-label="Carregando mini calendário" /> : calendar.isError ? <div role="alert" className="space-y-2 py-4 text-sm"><p>Não foi possível carregar o calendário.</p><Button variant="outline" size="sm" onClick={() => void calendar.refetch()}>Tentar novamente</Button></div> : <>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden="true">{["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={index} className="pb-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Dias do mini calendário">{Array.from({ length: cellCount }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1 || day > count) return <span key={index} aria-hidden="true" />;
        const iso = `${month.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const row = rows.get(iso);
        const disciplines = [...new Set(row?.planejado.map(item => item.disciplina_id) ?? [])];
        const hasStudy = (row?.minutos_realizados ?? 0) > 0;
        const hasPlan = (row?.minutos_planejados ?? 0) > 0;
        const hasReview = row?.planejado.some(item=>item.modo === 'revisao');
        const label = `${fmtDateBR(iso)}${iso === today ? ", hoje" : ""}${hasPlan ? `, ${duration(row!.minutos_planejados)} planejados` : ""}${hasStudy ? `, ${duration(row!.minutos_realizados)} estudados` : ""}${hasReview ? ', revisão programada' : ''}`;
        return <button type="button" key={iso} aria-label={label} aria-pressed={selected === iso} aria-current={iso === today ? "date" : undefined} title={label} onClick={() => setSelected(iso)} className={cn("flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg border border-transparent px-0.5 text-xs tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected === iso && "border-primary/50 bg-primary/10 font-semibold", iso === today && "ring-1 ring-primary ring-inset")}><span>{day}</span><span className="flex min-h-2 items-center gap-0.5" aria-hidden="true">{disciplines.slice(0, 2).map(id => <span key={id} className={cn("size-1.5 rounded-full", getDisciplinaPalette(id).progressFill)} style={{backgroundColor:getDisciplinaColor(id).color}} />)}{hasStudy && <Check className="size-2.5 text-success-text" />}{hasReview && <Repeat2 className="size-2.5 text-review"/>}</span></button>;
      })}</div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Pontos: disciplinas planejadas · ✓: estudo registrado · ↻: revisão programada. Contorno: hoje · fundo: dia selecionado.</p>
      {selected ? <div className="mt-3 border-t border-border pt-3"><h3 className="mb-2 text-xs font-semibold">Sessões de {fmtDateBR(selected)}</h3>{selectedLoading ? <Skeleton className="h-16" aria-label="Carregando sessões do dia" /> : detail.isError ? <div role="alert" className="space-y-2 text-xs"><p>Não foi possível carregar as sessões deste dia.</p><Button variant="outline" size="sm" onClick={() => void detail.refetch()}>Tentar novamente</Button></div> : <>
        <ul className="max-h-40 space-y-1 overflow-y-auto" aria-label="Sessões do dia selecionado">{planned.map(item => <li key={`${item.fonte}-${item.id}`} className={cn("flex min-w-0 items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs", getDisciplinaPalette(item.disciplina_id).calendarItem)}><span className="min-w-0 truncate" title={item.disciplina_nome}>{item.disciplina_nome}<span className="block text-[10px]">Planejada</span></span><span className="shrink-0 tabular-nums">{duration(item.duracao_minutos)}</span></li>)}{real.map(session => <li key={session.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs"><span className="min-w-0 truncate">{names.get(session.disciplina_id) ?? "Estudo registrado"}<span className="block text-[10px] text-success-text">Realizada</span></span><span className="shrink-0 tabular-nums">{duration(session.tempo_estudo_segundos / 60)}</span></li>)}</ul>
        {!planned.length && !real.length && <p className="text-xs text-muted-foreground">Nenhuma sessão neste dia. <Link to="/cronograma" className="font-medium text-primary hover:underline">Planejar estudos</Link></p>}
      </>}</div> : <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">Selecione um dia para consultar suas sessões.</p>}
    </>}
  </section>;
}
