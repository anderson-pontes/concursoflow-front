import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, CalendarCheck, Clock3, Flame, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDuracaoCalendario } from "@/lib/calendario/format";
import { fmtDateBR, hojeISO } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { ActivityCardHeader } from "./ActivityCardHeader";

export type HeatmapData = { date: string; count: number; minutes?: number | null };

const WEEK_COUNT = 16;
const DAYS_PER_WEEK = 7;
const WINDOW_DAYS = WEEK_COUNT * DAYS_PER_WEEK;
const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const levels = ["Nenhum estudo", "Até 30 minutos", "Acima de 30 minutos até 2 horas", "Acima de 2 horas até 4 horas", "Acima de 4 horas"];
const longDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

function intensity(minutes: number | null) {
  if (minutes === null) return "unknown";
  if (minutes === 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 120) return 2;
  if (minutes <= 240) return 3;
  return 4;
}

function studyDays(data: HeatmapData[], endDate: string) {
  const end = new Date(endDate + "T12:00:00Z");
  const byDate = new Map(data.map(row => [row.date, row]));
  let activeDays = 0;
  let totalMinutes = 0;
  let unknownDays = 0;
  let streak = 0;
  let longest = 0;
  const months = new Map<number, string>();
  const cells = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - WINDOW_DAYS + 1 + index);
    const iso = date.toISOString().slice(0, 10);
    const row = byDate.get(iso);
    const minutes = row && !Number.isFinite(row.minutes) ? null : Math.max(0, row?.minutes ?? 0);
    const active = Boolean(row?.count || minutes === null || minutes);
    if (active) activeDays++;
    if (minutes === null) unknownDays++;
    streak = active ? streak + 1 : 0;
    longest = Math.max(longest, streak);
    totalMinutes += minutes ?? 0;
    const duration = minutes === null ? "Estudo registrado — duração indisponível"
      : !active ? "Nenhum estudo registrado neste dia" : "Tempo estudado: " + fmtDuracaoCalendario(minutes);
    const sessions = row?.count ? row.count + (row.count === 1 ? " sessão" : " sessões") : null;
    const column = Math.floor(index / DAYS_PER_WEEK);
    if (index === 0 || (date.getUTCDate() === 1 && !months.has(column))) {
      months.set(column, shortMonth.format(date).replace(".", ""));
    }
    const dateLabel = longDate.format(date);
    const label = [dateLabel, duration, sessions].filter(Boolean).join(", ");
    return { iso, weekday: weekdays[date.getUTCDay()], dateLabel, label, duration, sessions, level: intensity(minutes) };
  });
  return { cells, activeDays, totalMinutes, unknownDays, longest, months };
}

export function HeatmapCard({
  className, data, scopeLabel = "Todos os concursos", endDate = hojeISO(),
  isLoading = false, isError = false, onRetry, historyHref,
}: {
  className?: string; data: HeatmapData[]; scopeLabel?: string; endDate?: string;
  isLoading?: boolean; isError?: boolean; onRetry?: () => void; historyHref?: string;
}) {
  const heading = useId();
  const legendHeading = useId();
  const { cells, activeDays, totalMinutes, unknownDays, longest, months } = useMemo(() => studyDays(data, endDate), [data, endDate]);
  const [focused, setFocused] = useState(WINDOW_DAYS - 1);
  const [selected, setSelected] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const presented = cells.find(cell => cell.iso === (preview ?? selected));

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    const delta = moves[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? WINDOW_DAYS - 1 : index + delta;
    buttons.current[Math.max(0, Math.min(WINDOW_DAYS - 1, next))]?.focus();
  }

  const metrics = [
    { Icon: CalendarCheck, value: activeDays, label: activeDays === 1 ? "Dia com estudo" : "Dias com estudo", tone: "indigo" },
    { Icon: Clock3, value: unknownDays && !totalMinutes ? "—" : fmtDuracaoCalendario(totalMinutes), label: "Tempo registrado", tone: "emerald" },
    { Icon: Flame, value: longest + (longest === 1 ? " dia" : " dias"), label: "Maior sequência", tone: "amber" },
  ];
  return <section data-slot="card" className={cn("dashboard-analytics-card dashboard-activity-card self-start", className)} aria-labelledby={heading}>
    <ActivityCardHeader id={heading} Icon={Flame} title="Constância de estudos" description="Seu ritmo de preparação nas últimas 16 semanas">
      <Popover>
        <PopoverTrigger asChild><Button size="icon" variant="ghost" aria-label="Sobre o período de constância"><Info className="size-4" /></Button></PopoverTrigger>
        <PopoverContent align="end" className="max-w-[calc(100vw-2rem)] text-sm">
          {scopeLabel} · janela fixa de 112 dias, incluindo hoje. O mapa não acompanha o filtro de período do Dashboard.
        </PopoverContent>
      </Popover>
    </ActivityCardHeader>
    {isLoading ? <div aria-label="Carregando constância" className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(index => <Skeleton key={index} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-[clamp(14rem,52cqi,20rem)] rounded-xl" />
      <Skeleton className="h-10 rounded-lg" />
    </div>
      : isError ? <div role="alert" className="space-y-2 text-sm"><p>Não foi possível carregar a constância.</p>{onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>}</div>
      : <>
        <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {metrics.map(({ Icon, value, label, tone }) => <div key={tone} data-tone={tone} className="dashboard-analytics-stat activity-metric min-w-0 rounded-xl">
            <dt className="contents"><span className="activity-metric-label text-xs leading-tight">{label}</span></dt>
            <dd className="contents">
              <span className="dashboard-analytics-stat__icon grid size-6 place-items-center rounded-md" aria-hidden="true"><Icon className="size-3.5" /></span>
              <span className="dashboard-analytics-stat__value min-w-0 font-bold leading-tight tracking-tight tabular-nums">{value}</span>
            </dd>
          </div>)}
        </dl>
        <div className="activity-surface space-y-2 rounded-xl">
          <div className="activity-heatmap-scroll min-w-0 overflow-x-auto" role="region" aria-label="Mapa de calor de 16 semanas. Use as setas para consultar os dias.">
            <div className="activity-heatmap mx-auto grid w-max">
              <div className="activity-heatmap-months col-start-2 grid text-xs font-medium text-muted-foreground" aria-hidden="true">
                {[...months].map(([column, month]) => <span key={column} style={{ gridColumn: column + 1 }} className="capitalize">{month}</span>)}
              </div>
              <div className="activity-heatmap-weekdays grid items-center text-[11px] font-medium text-muted-foreground" aria-hidden="true">
                {cells.slice(0, DAYS_PER_WEEK).map(cell => <span key={cell.iso}>{cell.weekday}</span>)}
              </div>
              <div className="activity-heatmap-days grid" role="group" aria-label="Duração registrada por dia">
                {cells.map((cell, index) => <button key={cell.iso} type="button" ref={node => { buttons.current[index] = node; }}
                  data-level={cell.level} className="activity-heatmap-cell" tabIndex={focused === index ? 0 : -1}
                  aria-label={cell.label} title={cell.label}
                  aria-pressed={selected === cell.iso}
                  onPointerEnter={event => { if (event.pointerType !== "touch") setPreview(cell.iso); }}
                  onPointerLeave={() => setPreview(undefined)}
                  onFocus={() => { setFocused(index); setPreview(cell.iso); }}
                  onBlur={() => setPreview(undefined)}
                  onKeyDown={event => {
                    if (event.key === "Escape") { setSelected(undefined); setPreview(undefined); }
                    else moveFocus(event, index);
                  }}
                  onClick={() => setSelected(cell.iso === selected ? undefined : cell.iso)}
                />)}
              </div>
            </div>
          </div>
          <div className="activity-heatmap-detail rounded-lg text-xs text-muted-foreground">
            {presented ? <>
              <p className="font-semibold first-letter:uppercase text-foreground">{presented.dateLabel}</p>
              <p>{presented.duration}{presented.sessions && " · " + presented.sessions}</p>
            </> : <p>{activeDays ? "Consulte a duração e as sessões de cada dia no mapa." : "Nenhum estudo registrado nesta janela."}</p>}
          </div>
        </div>
        <footer className="activity-card-footer space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="activity-control inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2" aria-label="Consultar intervalos de intensidade">
                  Menos {levels.map((level, index) => <span key={level} title={level} data-level={index} className="activity-heatmap-swatch" aria-hidden="true" />)} Mais
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] text-xs">
                <p id={legendHeading} className="mb-2 font-semibold">Duração estudada por dia</p>
                <ul aria-labelledby={legendHeading} className="space-y-2">{levels.map((level, index) => <li key={level} className="flex items-center gap-2"><span data-level={index} className="activity-heatmap-swatch" />{level}</li>)}</ul>
              </PopoverContent>
            </Popover>
            <span className="inline-flex items-center gap-1.5"><span data-level="unknown" className="activity-heatmap-swatch" aria-hidden="true" />Duração indisponível</span>
          </div>
          {unknownDays > 0 && <p className="text-xs text-muted-foreground">{unknownDays} {unknownDays === 1 ? "dia sem duração informada" : "dias sem duração informada"}. O total soma as durações disponíveis.</p>}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <p>{fmtDateBR(cells[0].iso)} a {fmtDateBR(endDate)}</p>
            {historyHref && <Link className="activity-link" to={historyHref}>Histórico de estudos <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>}
          </div>
        </footer>
      </>}
  </section>;
}
