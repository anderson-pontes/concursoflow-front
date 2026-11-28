import { useId, type ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import "./dashboard-soft-surfaces.css";
import "./dashboard-summary-cards.css";

type DashboardSummaryCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "coral" | "violet" | "amber";
  count?: number;
  action: { label: string; to: string };
  children: ReactNode;
};

export function DashboardSummaryCard({ title, description, icon: Icon, tone, count, action, children }: DashboardSummaryCardProps) {
  const headingId = useId();
  return <Card className="dashboard-summary-card gap-3" data-tone={tone} role="region" aria-labelledby={headingId}>
    <CardHeader className="flex items-start gap-3">
      <span className="dashboard-soft-icon grid size-11 shrink-0 place-items-center rounded-xl" aria-hidden>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 id={headingId} className="text-base font-semibold leading-tight tracking-tight sm:text-lg">{title}</h3>
        <CardDescription className="dashboard-summary-description mt-1 text-[0.8125rem] leading-snug">{description}</CardDescription>
      </div>
      {count !== undefined && <span className="dashboard-summary-count rounded-lg px-2 py-0.5 text-sm font-semibold tabular-nums">
        <span className="sr-only">Total: </span>{count.toLocaleString("pt-BR")}
      </span>}
    </CardHeader>
    <CardContent className="flex min-w-0 flex-1 flex-col">{children}</CardContent>
    <div className="dashboard-summary-footer mx-4 border-t pt-2.5">
      <Link to={action.to} className="dashboard-summary-action flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {action.label}<ArrowRight className="size-4 shrink-0" aria-hidden />
      </Link>
    </div>
  </Card>;
}

export function DashboardSummaryEmpty({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="dashboard-summary-panel flex flex-1 flex-col items-start justify-center gap-2 rounded-xl p-3.5">
    <span className="dashboard-summary-count grid size-8 place-items-center rounded-lg" aria-hidden><Icon className="size-4" /></span>
    <div className="space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  </div>;
}

export function DashboardSummaryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="dashboard-summary-panel flex flex-1 flex-col items-start justify-center gap-2 rounded-xl p-3.5">
    <p role="alert" className="text-sm font-medium">{message}</p>
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
  </div>;
}

export function DashboardSummaryLoading() {
  return <div role="status" aria-label="Carregando dados do card" className="space-y-2">
    <Skeleton className="h-10 rounded-lg" />
    <Skeleton className="h-12 rounded-lg" />
  </div>;
}
