import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDownUp, ArrowUpRight, BarChart3, BookOpen, CircleCheck, Clock, History, Layers3, PieChart as PieChartIcon, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Pie, PieChart } from "recharts";
import { DashboardCardActions } from "@/components/dashboard/DashboardCard";
import { PeriodPlanComparison, SyllabusCoverage } from "@/components/dashboard/DashboardAnalyticsMetrics";
import { disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectField } from "@/components/ui/select-field";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDashboardDuration, percentBR, type AnalysisDiscipline, type DashboardAnalysis } from "@/lib/dashboard/analysis";
import "./dashboard-soft-surfaces.css";
import "./dashboard-discipline-charts.css";

const PREVIEW_SIZE = 5;
const MISSING_PREVIEW_SIZE = 3;
const MAX_SEGMENTS = 6;
const MAX_FOOTER_GAP = 64;
const EDITAL_URL = "/disciplinas?view=edital";
const timeChartConfig = { minutos: { label: "Tempo estudado" } };
const linkClass = "inline-flex min-h-10 max-w-full items-center gap-2 rounded-md text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const actionsClass = "mx-4 justify-between gap-y-1 pt-2";
const sortLabels = { least: "Menor progresso primeiro", most: "Maior progresso primeiro", name: "Nome da disciplina" };
type ProgressSort = keyof typeof sortLabels;
const sortOptions = Object.entries(sortLabels).map(([value, label]) => ({ value, label }));
const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "started", label: "Em andamento" },
  { value: "new", label: "Não iniciadas" },
  { value: "done", label: "Concluídas" },
  { value: "empty", label: "Sem tópicos" },
];
const subjectName = new Intl.Collator("pt-BR");
const progressFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function progressStatus(row: AnalysisDiscipline) {
  if (row.topicos_total === 0) return "empty";
  if (row.topicos_concluidos >= row.topicos_total) return "done";
  return (row.topicos_iniciados ?? row.topicos_concluidos) > 0 ? "started" : "new";
}

function measurableProgress(row: AnalysisDiscipline) {
  return row.topicos_total > 0 ? row.progresso_pct : null;
}

function sortProgress(rows: AnalysisDiscipline[], sort: ProgressSort) {
  return [...rows].sort((a, b) => {
    const byName = subjectName.compare(a.nome, b.nome);
    const first = measurableProgress(a);
    const second = measurableProgress(b);
    if (first === null || second === null) {
      return Number(first === null) - Number(second === null) || byName;
    }
    if (sort === "name") return byName;
    const difference = first - second;
    return (sort === "least" ? difference : -difference) || byName;
  });
}

function AnalyticsHeader({ Icon, title, description }: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return <CardHeader className="flex items-start gap-3">
    <span className="dashboard-soft-icon flex size-10 shrink-0 items-center justify-center rounded-xl">
      <Icon className="size-5" aria-hidden />
    </span>
    <div className="min-w-0">
      <CardTitle role="heading" aria-level={3} className="font-semibold">{title}</CardTitle>
      <CardDescription className="mt-0.5 text-xs leading-relaxed">{description}</CardDescription>
    </div>
  </CardHeader>;
}

function ProgressSortSelect({ value, onChange }: { value: ProgressSort; onChange: (sort: ProgressSort) => void }) {
  return <Select value={value} onValueChange={next => onChange(next as ProgressSort)}>
    <SelectTrigger className="min-h-9 w-auto min-w-0 max-w-full bg-card py-1" aria-label="Ordenar disciplinas">
      <ArrowDownUp className="mr-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left"><SelectValue /></span>
    </SelectTrigger>
    <SelectContent>
      {sortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function SubjectProgressItem({ row, inSheet = false }: { row: AnalysisDiscipline; inSheet?: boolean }) {
  const done = progressStatus(row) === "done";
  const value = measurableProgress(row);
  const color = disciplineColorStyle(row.id, row.cor_hex);
  const nameLink = <Link to={`/disciplinas/${row.id}`} className="block rounded-sm text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {row.nome}
  </Link>;
  return <li className="dashboard-subject-item grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-xl border border-border/70 px-3 py-2"
    data-no-progress={value === null || undefined} style={{ ...color, borderLeftColor: value === null ? undefined : color.borderLeftColor }}>
    <span className="dashboard-subject-item__icon grid size-7 place-items-center rounded-lg" aria-hidden>
      <BookOpen className="size-4" />
    </span>
    <div className="min-w-0">
      {inSheet ? <SheetClose asChild>{nameLink}</SheetClose> : nameLink}
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
        {row.topicos_total ? `${row.topicos_concluidos} de ${row.topicos_total} tópicos concluídos` : "Sem tópicos cadastrados"}
      </p>
    </div>
    <span className="dashboard-subject-item__value flex items-center gap-1 text-sm font-semibold tabular-nums">
      {done && <CircleCheck className="size-4 text-success-text" aria-label="Concluída" role="img" />}
      {value === null ? "Não disponível" : `${progressFormat.format(value)}%`}
    </span>
    {value !== null && <div className="dashboard-subject-track col-span-3 h-1.5 rounded-full"
      role="meter" aria-label={`Progresso de ${row.nome}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      {value > 0 && <div className="dashboard-subject-track__fill" style={{ width: `${value}%` }} />}
    </div>}
  </li>;
}

type DetailSheetProps = { trigger: string; title: string; description: string; children: ReactNode };
function DetailSheet({ trigger, title, description, children }: DetailSheetProps) {
  return <Sheet>
    <SheetTrigger asChild><Button type="button" variant="ghost" className="min-h-10 max-w-full justify-start whitespace-normal px-0 text-left leading-snug text-primary hover:text-primary hover:underline">
      {trigger}<ArrowUpRight className="size-4" aria-hidden />
    </Button></SheetTrigger>
    <SheetContent className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&>button]:grid [&>button]:size-10 [&>button]:place-items-center">
      <SheetHeader className="border-b border-border px-4 py-5 pr-16 text-left sm:px-6">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{children}</div>
    </SheetContent>
  </Sheet>;
}

function FullSubjectProgress({ rows, initialSort }: { rows: AnalysisDiscipline[]; initialSort: ProgressSort }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [status, setStatus] = useState("");
  const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
  const term = normalize(search.trim());
  const filtered = sortProgress(rows.filter(row => (!status || progressStatus(row) === status)
    && normalize(row.nome).includes(term)), sort);
  return <div className="space-y-3">
    <Input type="search" aria-label="Buscar disciplina" placeholder="Buscar disciplina" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="flex flex-wrap gap-2 [&>button]:flex-auto">
      <ProgressSortSelect value={sort} onChange={setSort} />
      <SelectField className="h-10 min-w-0 bg-card" aria-label="Filtrar por status" value={status} options={statusOptions} onValueChange={setStatus} />
    </div>
    <p role="status" className="text-xs text-muted-foreground">{filtered.length} de {rows.length} disciplinas</p>
    {filtered.length > 0 ? <ul className="space-y-2">
      {filtered.map(row => <SubjectProgressItem key={row.id} row={row} inSheet />)}
    </ul> : <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">Nenhuma disciplina encontrada com esses filtros.</p>}
  </div>;
}

function SubjectProgressCard({ rows }: { rows: AnalysisDiscipline[] }) {
  const [sort, setSort] = useState<ProgressSort>("least");
  const preview = sortProgress(rows, sort).slice(0, PREVIEW_SIZE);
  const totals = rows.reduce((sum, row) => ({
    done: sum.done + row.topicos_concluidos,
    pending: sum.pending + row.topicos_total - row.topicos_concluidos,
    withoutTopics: sum.withoutTopics + Number(row.topicos_total === 0),
  }), { done: 0, pending: 0, withoutTopics: 0 });
  const stats = [
    { label: "Disciplinas", value: rows.length, Icon: Layers3, tone: "indigo" },
    { label: "Tópicos concluídos", value: totals.done, Icon: CircleCheck, tone: "emerald" },
    { label: "Tópicos pendentes", value: totals.pending, Icon: Clock, tone: "amber" },
  ];
  return <Card className="dashboard-analytics-card gap-3">
    <AnalyticsHeader Icon={BarChart3} title="Progresso por disciplina" description="Avanço acumulado nos tópicos do edital" />
    <CardContent className="flex flex-col gap-2.5">
      {rows.length > 0 ? <>
        <dl className="dashboard-analytics-stats grid grid-cols-3 gap-1.5 sm:gap-2">
          {stats.map(({ label, value, Icon, tone }) => <div key={label} data-tone={tone} className="dashboard-analytics-stat grid min-w-0 content-start gap-1 rounded-xl px-2 py-2">
            <dt className="row-start-2 text-xs font-medium leading-snug [overflow-wrap:anywhere]">{label}</dt>
            <dd className="row-start-1 flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="dashboard-analytics-stat__icon grid size-6 shrink-0 place-items-center rounded-md" aria-hidden>
                <Icon className="size-3.5" />
              </span>
              <span className="dashboard-analytics-stat__value min-w-0 font-semibold leading-none tracking-tight tabular-nums [overflow-wrap:anywhere]">{value.toLocaleString("pt-BR")}</span>
            </dd>
          </div>)}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div>
            <h4 className="text-sm font-semibold">Cobertura do edital</h4>
            <p className="text-xs text-muted-foreground">Exibindo {preview.length} de {rows.length} disciplinas</p>
          </div>
          <ProgressSortSelect value={sort} onChange={setSort} />
        </div>
        <ul aria-label="Resumo de progresso por disciplina" className="space-y-1.5">
          {preview.map(row => <SubjectProgressItem key={row.id} row={row} />)}
        </ul>
        <SyllabusCoverage completed={totals.done} total={totals.done + totals.pending} withoutTopics={totals.withoutTopics} />
      </> : <p className="rounded-xl bg-muted/35 p-4 text-sm text-muted-foreground">Nenhuma disciplina cadastrada no concurso ativo.</p>}
    </CardContent>
    <DashboardCardActions className={actionsClass}>
      {rows.length > 0 && <DetailSheet trigger="Ver todas as disciplinas" title="Todas as disciplinas" description="Consulte o progresso acumulado no edital do concurso ativo.">
        <FullSubjectProgress rows={rows} initialSort={sort} />
      </DetailSheet>}
      <Link to={EDITAL_URL} className={linkClass}><BookOpen className="size-4 shrink-0" aria-hidden />Abrir edital verticalizado</Link>
    </DashboardCardActions>
  </Card>;
}

type TimeEntry = { id: string; nome: string; minutos: number; fill: string; grouped?: number };

function TimeLegend({ entries, total, featured = false }: { entries: TimeEntry[]; total: number; featured?: boolean }) {
  return <ul aria-label="Tempo por disciplina" className="dashboard-time-legend grid w-full min-w-0 content-start gap-1.5">
    {entries.map(entry => {
      const share = entry.minutos / total * 100;
      return <li key={entry.id} data-featured={featured || undefined} className="dashboard-time-legend__item min-w-0 space-y-1.5 rounded-lg bg-muted/35 px-2.5 py-1.5"
        style={{ "--legend-color": entry.fill } as CSSProperties}>
        <div className="flex min-w-0 items-start gap-2">
          {featured ? <BookOpen className="dashboard-time-legend__icon mt-0.5 size-4 shrink-0" aria-hidden />
            : <span className="dashboard-time-legend__dot mt-1 size-2 shrink-0 rounded-full" aria-hidden />}
          <p className="dashboard-time-legend__name text-xs font-semibold leading-snug [overflow-wrap:anywhere]">{entry.nome}{entry.grouped && <span className="font-normal text-muted-foreground"> ({entry.grouped})</span>}</p>
        </div>
        <p className="dashboard-time-legend__metrics flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-snug tabular-nums">
          <strong className="dashboard-time-legend__duration font-semibold [overflow-wrap:anywhere]">{formatDashboardDuration(entry.minutos)}</strong>
          <span className="text-muted-foreground">{featured ? "100% do tempo estudado" : `${percentBR(share)} do tempo`}</span>
        </p>
        <div className="dashboard-time-legend__track h-1 overflow-hidden rounded-full" aria-hidden>
          <div className="dashboard-time-legend__dot h-full rounded-full" style={{ width: `${share}%` }} />
        </div>
      </li>;
    })}
  </ul>;
}

function StudyCoverage({ count, total }: { count: number; total: number }) {
  const percentage = count / total * 100;
  return <div className="space-y-1.5">
    <div className="flex flex-wrap justify-between gap-x-2 text-sm">
      <p className="font-medium">Cobertura no período</p>
      <p className="font-semibold tabular-nums">{progressFormat.format(percentage)}%</p>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-label="Cobertura das disciplinas no período"
      aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-valuetext={`${count} de ${total} disciplinas estudadas`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
    </div>
    <p className="text-xs text-muted-foreground"><strong className="font-semibold text-foreground">{count} de {total}</strong> disciplinas estudadas</p>
  </div>;
}

function UnrecordedList({ rows }: { rows: AnalysisDiscipline[] }) {
  return <ul aria-label="Disciplinas sem registros" className="space-y-1.5">
    {rows.map(row => <li key={row.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs">
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: disciplineColorStyle(row.id, row.cor_hex).borderLeftColor }} />
      <span className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{row.nome}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">0 min</span>
    </li>)}
  </ul>;
}

function UnrecordedSubjects({ rows }: { rows: AnalysisDiscipline[] }) {
  if (!rows.length) return <p className="text-xs text-muted-foreground">Todas as disciplinas têm registros neste período.</p>;
  return <section aria-label="Disciplinas sem registros no período" className="space-y-1.5">
    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
      <h4 className="text-sm font-semibold">Disciplinas sem registros no período</h4>
      <p className="text-xs font-medium tabular-nums text-muted-foreground">{rows.length} sem registros</p>
    </div>
    <UnrecordedList rows={rows.slice(0, MISSING_PREVIEW_SIZE)} />
    {rows.length > MISSING_PREVIEW_SIZE && <DetailSheet trigger="Ver todas as disciplinas sem registros" title="Disciplinas sem registros no período"
      description={`${rows.length} disciplinas do concurso ativo sem tempo de estudo registrado no intervalo selecionado.`}>
      <UnrecordedList rows={rows} />
    </DetailSheet>}
  </section>;
}

function StudyTimeDonut({ entries, total }: { entries: TimeEntry[]; total: number }) {
  const gradientId = useId();
  const featured = entries.length === 1 ? entries[0] : undefined;
  const segments = featured ? [{ ...featured, fill: `url(#${gradientId})` }] : entries;
  return <div className="dashboard-time-donut mx-auto grid aspect-square w-full max-w-[16rem] min-w-0 items-center">
    <ChartContainer config={timeChartConfig} initialDimension={{ width: 240, height: 240 }} className="col-start-1 row-start-1 aspect-square w-full [&_.recharts-sector]:stroke-card">
      <PieChart accessibilityLayer margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
        {featured && <defs>
          <linearGradient id={gradientId} x2="100%" y2="100%">
            <stop stopColor={`color-mix(in srgb, ${featured.fill} 86%, var(--foreground))`} />
            <stop offset="100%" stopColor={featured.fill} />
          </linearGradient>
        </defs>}
        <Pie data={segments} dataKey="minutos" nameKey="nome" innerRadius="73%" outerRadius="100%" strokeWidth={featured ? 0 : 2} animationDuration={420} />
        <ChartTooltip content={({ active, payload }) => {
          const entry = payload?.[0]?.payload as TimeEntry | undefined;
          return active && entry ? <div className="max-w-48 rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
            <p className="font-semibold [overflow-wrap:anywhere]">{entry.nome}</p>
            <p className="mt-1">{formatDashboardDuration(entry.minutos)} · {percentBR(entry.minutos / total * 100)}</p>
          </div> : null;
        }} />
      </PieChart>
    </ChartContainer>
    <div className="pointer-events-none col-start-1 row-start-1 mx-auto w-[68%] text-center">
      <p className="text-xs font-medium text-muted-foreground">Tempo total</p>
      <p className="dashboard-time-donut__total mt-0.5 font-semibold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatDashboardDuration(total)}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">no período</p>
    </div>
  </div>;
}

function StudyTimeDistributionCard({ rows, planned, studied }: { rows: AnalysisDiscipline[]; planned: number; studied: number }) {
  const ranked = rows.filter(row => row.minutos_estudados > 0)
    .sort((a, b) => b.minutos_estudados - a.minutos_estudados || subjectName.compare(a.nome, b.nome))
    .map(row => ({ id: row.id, nome: row.nome, minutos: row.minutos_estudados, fill: String(disciplineColorStyle(row.id, row.cor_hex).borderLeftColor) }));
  const total = ranked.reduce((sum, entry) => sum + entry.minutos, 0);
  const other = ranked.length > MAX_SEGMENTS ? ranked.slice(MAX_SEGMENTS - 1) : [];
  const entries = other.length ? [...ranked.slice(0, MAX_SEGMENTS - 1), {
    id: "other", nome: "Outras disciplinas", fill: "var(--muted-foreground)",
    minutos: other.reduce((sum, entry) => sum + entry.minutos, 0), grouped: other.length,
  }] : ranked;
  const unrecorded = rows.filter(row => row.minutos_estudados === 0).sort((a, b) => subjectName.compare(a.nome, b.nome));
  const layout = ranked.length === 1 ? "single" : ranked.length <= 4 ? "few" : "many";
  return <Card className="dashboard-analytics-card gap-3" data-tone="emerald">
    <AnalyticsHeader Icon={PieChartIcon} title="Distribuição do tempo" description="Tempo de estudo por disciplina no período selecionado" />
    <CardContent className="flex flex-col gap-2.5">
      {total > 0 ?
        <div className="dashboard-time-layout grid min-w-0 items-center gap-3" data-layout={layout}>
          <StudyTimeDonut entries={entries} total={total} />
          <div className="dashboard-time-breakdown min-w-0 space-y-2.5">
            <TimeLegend entries={entries} total={total} featured={layout === "single"} />
            <StudyCoverage count={ranked.length} total={rows.length} />
          </div>
        </div>
      : <>
        <div className="dashboard-period-insight flex flex-wrap items-center justify-between gap-x-2 rounded-xl px-3 py-1.5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />Nenhum estudo registrado neste período</p>
          <Link to="/cronograma" className={linkClass}>Acessar cronograma<ArrowUpRight className="size-4" aria-hidden /></Link>
        </div>
        {rows.length > 0 && <StudyCoverage count={0} total={rows.length} />}
      </>}
      {rows.length > 0 && <UnrecordedSubjects rows={unrecorded} />}
      <PeriodPlanComparison planned={planned} studied={studied} />
    </CardContent>
    <DashboardCardActions className={actionsClass}>
      <Link to="/estudos/historico" className={linkClass}><History className="size-4 shrink-0" aria-hidden />Ver histórico de estudos</Link>
      {other.length > 0 && <DetailSheet trigger="Ver distribuição completa" title="Distribuição completa do tempo" description={`${formatDashboardDuration(total)} em ${ranked.length} disciplinas no período selecionado.`}>
        <p className="mb-3 text-sm text-muted-foreground">O gráfico reúne as {other.length} menores participações em “Outras disciplinas”.</p>
        <div className="space-y-4">
          <TimeLegend entries={ranked.slice(0, MAX_SEGMENTS - 1)} total={total} />
          <section aria-label="Outras disciplinas" className="space-y-2">
            <h3 className="text-sm font-semibold">Outras disciplinas</h3>
            <TimeLegend entries={other} total={total} />
          </section>
        </div>
      </DetailSheet>}
    </DashboardCardActions>
  </Card>;
}

export function DashboardDisciplineCharts({ data }: { data?: DashboardAnalysis }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const hasCards = data !== undefined;
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !hasCards || typeof ResizeObserver === "undefined") return;
    const [left, right] = Array.from(grid.children, card => Array.from(card.children));
    // Measure intrinsic regions, so stretching the cards never changes the comparison.
    const height = (regions: Element[]) => regions.reduce((sum, region) => sum + region.getBoundingClientRect().height, 0);
    const observer = new ResizeObserver(() => {
      grid.toggleAttribute("data-align-footers", Math.abs(height(left) - height(right)) <= MAX_FOOTER_GAP);
    });
    for (const region of [...left, ...right]) observer.observe(region);
    return () => {
      observer.disconnect();
      grid.removeAttribute("data-align-footers");
    };
  }, [hasCards]);
  return <div className="dashboard-analytics-shell">
    <div ref={gridRef} data-dashboard-row="disciplines" className="dashboard-analytics-grid grid gap-4">
      {data ? <>
        <SubjectProgressCard rows={data.disciplinas} />
        <StudyTimeDistributionCard rows={data.disciplinas} planned={data.totais.minutos_planejados} studied={data.totais.minutos_estudados} />
      </> : <div role="status" aria-label="Carregando análise por disciplina" className="contents">
        <Skeleton aria-hidden className="h-96 rounded-xl" />
        <Skeleton aria-hidden className="h-96 rounded-xl" />
      </div>}
    </div>
  </div>;
}
