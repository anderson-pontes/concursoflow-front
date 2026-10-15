import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getDisciplinaColor } from "@/components/disciplinas/disciplinaPalettes";

type Props = {
  disciplinaId: string;
  className?: string;
  label?: string;
  shape?: "bar" | "dot";
};

/** Shared discipline identity marker for cards, calendars, lists and charts. */
export function DisciplineColorIndicator({ disciplinaId, className, label, shape = "bar" }: Props) {
  const color = getDisciplinaColor(disciplinaId);
  return <span
    aria-hidden="true"
    className={cn("inline-block shrink-0", shape === "dot" ? "size-2 rounded-full" : "h-8 w-1 rounded-full", className)}
    style={{ backgroundColor: color.color }}
    title={label}
  />;
}

export function disciplineColorStyle(disciplinaId: string) {
  const color = getDisciplinaColor(disciplinaId);
  return { "--discipline-color": color.color, "--discipline-soft": color.soft, "--discipline-on-soft": color.onSoft, borderLeftColor: color.color } as CSSProperties;
}
