import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "./metric-card.css";
export type MetricTone = "indigo" | "green" | "purple" | "blue" | "orange";
const tones: Record<MetricTone,string> = {indigo:"study-tone-indigo",green:"study-tone-emerald",purple:"study-tone-violet",blue:"metric-tone-blue",orange:"study-tone-amber"};
type Props = Omit<HTMLAttributes<HTMLDivElement>,"children"> & {
 label:string; value:ReactNode; description?:ReactNode; icon:LucideIcon; tone:MetricTone;
 labelAs?:"p"|"h2"; as?:"div"|"section"; children?:ReactNode;
};
/** KPI-only surface. The visual rules are shared with the reference discipline KPIs. */
export function MetricCard({label,value,description,icon:Icon,tone,labelAs:Label="p",as:Root="div",children,className,...props}:Props){
 return <Root data-metric-tone={tone} className={cn("metric-card flex h-full min-w-0 flex-col rounded-xl border p-3 text-foreground shadow-sm sm:p-4",tones[tone],className)} {...props}>
  <div className="mb-2 flex items-center gap-2 sm:mb-3"><span className="metric-card-icon flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9"><Icon className="size-4 sm:size-5" aria-hidden/></span><Label className="min-w-0 text-xs font-medium leading-snug [overflow-wrap:anywhere]">{label}</Label></div>
  <p className="text-2xl font-semibold tabular-nums tracking-tight [overflow-wrap:anywhere]">{value}</p>
  {description!=null&&<div className="metric-card-description mt-2 text-xs leading-relaxed [overflow-wrap:anywhere]">{description}</div>}
  {children&&<div className="mt-auto pt-3">{children}</div>}
 </Root>;
}
