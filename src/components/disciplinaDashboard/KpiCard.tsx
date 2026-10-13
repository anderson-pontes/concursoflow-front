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
        "rounded-xl border border-border bg-card p-5 shadow-sm border-border dark:bg-card",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
