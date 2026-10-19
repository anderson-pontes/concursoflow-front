import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
const tones = {
  indigo: "study-tone-indigo",
  emerald: "study-tone-emerald",
  violet: "study-tone-violet",
  blue: "discipline-tone-blue",
  amber: "study-tone-amber",
};
type KpiCardProps = { title: string; children: React.ReactNode; className?: string; icon?: LucideIcon; tone?: keyof typeof tones; };
export function KpiCard({ title, children, className, icon: Icon, tone = "indigo" }: KpiCardProps) {
  return <div data-discipline-kpi={tone} className={cn("discipline-kpi min-w-0 rounded-xl border p-3 shadow-sm transition-colors sm:p-4", tones[tone], className)}>
    <div className="mb-2 flex items-center gap-2 sm:mb-3">
      {Icon && <span className="discipline-kpi-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9"><Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden /></span>}
      <p className="text-xs font-medium leading-snug text-foreground">{title}</p>
    </div>
    <div>{children}</div>
  </div>;
}
