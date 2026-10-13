import { BarChart3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "amber";

export function KpiCard({
  label,
  value,
  sub,
  badge,
  badgeVariant,
  progress,
  icon: Icon = BarChart3,
}: {
  label: string;
  value: string;
  sub: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  progress?: number;
  icon?: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="rounded-lg bg-primary/10 p-2"><Icon className="size-5 shrink-0 text-primary" /></span>
        <span className="break-words">{label}</span>
      </div>
      <div className="mb-0.5 min-w-0 break-words text-3xl font-semibold tabular-nums text-card-foreground">{value}</div>
      <div className="min-w-0 break-words text-sm text-muted-foreground">{sub}</div>

      {progress !== undefined ? (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      ) : null}

      {badge ? (
        <span
          className={cn(
            "mt-2 inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
            badgeVariant === "green" && "bg-success-50 text-success-800",
            badgeVariant === "amber" && "bg-warning-50 text-warning-800",
          )}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

