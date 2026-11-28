import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "./dashboard-soft-surfaces.css";
import "./dashboard-discipline-charts.css";
import "./dashboard-study-activity.css";

export function ActivityCardHeader({ id, Icon, title, description, children }: {
  id: string; Icon: LucideIcon; title: string; description: string; children?: ReactNode;
}) {
  return <header className="activity-card-header flex flex-wrap items-start gap-x-3 gap-y-2">
    <span className="dashboard-soft-icon grid size-11 shrink-0 place-items-center rounded-[14px]" aria-hidden="true"><Icon className="size-5" /></span>
    <div className="min-w-0 flex-1">
      <h2 id={id} className="text-base font-semibold leading-snug tracking-tight">{title}</h2>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
    </div>
    {children}
  </header>;
}
