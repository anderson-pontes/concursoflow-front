import React from "react";

type Props = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, icon, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40 ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon ? <span className="text-primary-600 dark:text-primary-400">{icon}</span> : null}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
