import { useId, type ReactNode } from "react";
import { CalendarClock, CalendarDays, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardPeriod } from "@/lib/dashboard/analysis";
import { formatExamDate, formatNumericDate } from "@/lib/dashboard/dates";
import "./dashboard-soft-surfaces.css";

export type DashboardContest = {
  nome: string;
  orgao: string;
  cargo: string | null;
  data_prova: string | null;
};

const periods = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "30days", label: "Últimos 30 dias" },
] as const;

function examTone(days: number | null) {
  if (days === null || days < 0) return "neutral";
  if (days === 0) return "today";
  if (days <= 15) return "orange";
  if (days <= 30) return "amber";
  if (days <= 90) return "blue";
  return "indigo";
}

function ExamCountdown({ days, date }: { days: number | null; date: string | null }) {
  const tone = examTone(days);
  return (
    <div data-tone={tone} className="dashboard-exam min-w-0 rounded-xl border px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--exam-ink)]">
        <CalendarClock className="size-4 shrink-0" aria-hidden /> Prova
      </p>
      <p className="mt-1 text-sm leading-snug text-foreground">
        {days === null ? "Data da prova ainda não informada"
          : days > 0 ? <><strong className="text-xl font-semibold tabular-nums text-[color:var(--exam-ink)]">{days}</strong>{" "}{days === 1 ? "dia para a prova" : "dias para a prova"}</>
          : days === 0 ? <strong className="font-semibold text-primary">A prova é hoje</strong>
          : `Prova realizada há ${Math.abs(days)} ${days === -1 ? "dia" : "dias"}`}
      </p>
      {date
        ? <time dateTime={date} className="mt-1 block text-xs text-muted-foreground">{formatExamDate(date)}</time>
        : <Link to="/concursos" className="mt-1 inline-flex min-h-6 items-center text-xs font-medium text-primary underline underline-offset-2">Cadastrar data da prova</Link>}
    </div>
  );
}

export function DashboardPeriodFilter({ value, onValueChange, range }: {
  value: DashboardPeriod;
  onValueChange: (value: DashboardPeriod) => void;
  range: { inicio: string; fim: string };
}) {
  const rangeId = useId();
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card/70 p-2">
      <Select value={value} onValueChange={(next) => onValueChange(next as DashboardPeriod)}>
        <SelectTrigger aria-label="Período do dashboard" aria-describedby={rangeId} className="border-transparent bg-transparent px-2 font-semibold transition-colors hover:bg-muted">
          <span className="flex min-w-0 items-center gap-1.5 text-left">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0"><SelectValue /></span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <p id={rangeId} className="px-2 pb-0.5 text-xs leading-relaxed tabular-nums text-muted-foreground">
        <time className="whitespace-nowrap" dateTime={range.inicio}>{formatNumericDate(range.inicio)}</time>
        {" — "}
        <time className="whitespace-nowrap" dateTime={range.fim}>{formatNumericDate(range.fim)}</time>
      </p>
    </div>
  );
}

export function DashboardContextHeader({ contest, daysUntilExam, children }: {
  contest: DashboardContest;
  daysUntilExam: number | null;
  children?: ReactNode;
}) {
  const details = [contest.orgao !== contest.nome ? contest.orgao : null, contest.cargo].filter(Boolean).join(" · ");
  return (
    <header className="dashboard-context min-w-0 rounded-2xl border p-4 sm:p-5">
      <div className="dashboard-context__body">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="dashboard-soft-icon grid size-12 shrink-0 place-items-center rounded-xl">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Concurso ativo</p>
            <h1 className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere]">{contest.nome}</h1>
            {details && <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{details}</p>}
          </div>
        </div>
        <div className="dashboard-context__tools">
          <ExamCountdown days={daysUntilExam} date={contest.data_prova} />
          {children}
        </div>
      </div>
    </header>
  );
}
