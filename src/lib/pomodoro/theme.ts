export type PomodoroPhase = "foco" | "pausa";

export type PomodoroTheme = {
  shell: string;
  topBar: string;
  glow: string;
  arc: string;
  accent: string;
  accentSoft: string;
  chip: string;
  chipText: string;
  modeLabel: string;
  subLabel: string;
  ring: string;
};

export function getPomodoroTheme(phase: PomodoroPhase, isCronometro: boolean): PomodoroTheme {
  if (isCronometro) {
    return {
      shell: "bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950",
      topBar: "bg-emerald-500",
      glow: "bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(16,185,129,0.22),transparent_70%)]",
      arc: "stroke-emerald-400",
      accent: "text-emerald-300",
      accentSoft: "bg-emerald-500/15 text-emerald-200",
      chip: "bg-emerald-500/15 text-emerald-200",
      chipText: "text-emerald-200",
      modeLabel: "Cronômetro",
      subLabel: "Sessão livre",
      ring: "border-emerald-400/20 bg-emerald-500/10",
    };
  }

  if (phase === "pausa") {
    return {
      shell: "bg-gradient-to-br from-amber-950 via-orange-950 to-amber-900",
      topBar: "bg-amber-500",
      glow: "bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(245,158,11,0.2),transparent_70%)]",
      arc: "stroke-amber-400",
      accent: "text-amber-300",
      accentSoft: "bg-amber-500/15 text-amber-200",
      chip: "bg-amber-500/15 text-amber-200",
      chipText: "text-amber-200",
      modeLabel: "Pausa",
      subLabel: "Descanse",
      ring: "border-amber-400/20 bg-amber-500/10",
    };
  }

  return {
    shell: "bg-gradient-to-br from-primary-950 via-violet-950 to-indigo-950",
    topBar: "bg-primary",
    glow: "bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_70%)]",
    arc: "stroke-primary-400",
    accent: "text-primary-300",
    accentSoft: "bg-primary/20 text-primary-200",
    chip: "bg-primary/20 text-primary-200",
    chipText: "text-primary-200",
    modeLabel: "Foco",
    subLabel: "Mantenha a concentração",
    ring: "border-primary/25 bg-primary/10",
  };
}
