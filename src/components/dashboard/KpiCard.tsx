import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "amber";

export function KpiCard({
  label,
  value,
  sub,
  badge,
  badgeVariant,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-neutral-400">
        <BarChart3 className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mb-0.5 text-2xl font-medium text-neutral-800 dark:text-neutral-100">{value}</div>
      <div className="text-[11px] text-neutral-400">{sub}</div>

      {progress !== undefined ? (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {badge ? (
        <span
          className={cn(
            "mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium",
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

