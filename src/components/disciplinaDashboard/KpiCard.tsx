import React from "react";

import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function KpiCard({ title, children, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-card",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-neutral-400">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
