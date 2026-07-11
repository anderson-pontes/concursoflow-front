import React from "react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, icon, children, className = "" }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
