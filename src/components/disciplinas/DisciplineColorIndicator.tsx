import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getDisciplinaColor } from "@/components/disciplinas/disciplinaPalettes";

type Props = {
  disciplinaId: string;
  className?: string;
  label?: string;
  shape?: "bar" | "dot";
  customColor?: string | null;
};

/** Shared discipline identity marker for cards, calendars, lists and charts. */
export function DisciplineColorIndicator({ disciplinaId, className, label, shape = "bar", customColor }: Props) {
  const color = disciplineColorStyle(disciplinaId, customColor);
  return <span
    aria-hidden="true"
    className={cn("inline-block shrink-0", shape === "dot" ? "size-2 rounded-full" : "h-8 w-1 rounded-full", className)}
    style={{ backgroundColor: color.borderLeftColor }}
    title={label}
  />;
}

export function disciplineColorStyle(disciplinaId: string, customColor?: string | null) {
  const palette = getDisciplinaColor(disciplinaId);
  const custom = customColor && /^#[0-9a-f]{6}$/i.test(customColor) ? customColor : null;
  const color = custom ?? palette.color;
  return {
    "--discipline-color": color,
    "--discipline-soft": custom ? "color-mix(in srgb, var(--discipline-color) 9%, var(--card))" : palette.soft,
    "--discipline-on-soft": custom ? "var(--card-foreground)" : palette.onSoft,
    borderLeftColor: color,
  } as CSSProperties;
}
