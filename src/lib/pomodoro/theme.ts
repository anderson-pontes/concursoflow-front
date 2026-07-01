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
      shell: "bg-gradient-to-br from-[#041510] via-[#062018] to-[#031510]",
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
      shell: "bg-gradient-to-br from-[#1a0f00] via-[#241400] to-[#2d1900]",
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
    shell: "bg-gradient-to-br from-[#0f0a1a] via-[#150f28] to-[#1a1233]",
    topBar: "bg-[#6C3FC5]",
    glow: "bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(108,63,197,0.28),transparent_70%)]",
    arc: "stroke-[#A78BFA]",
    accent: "text-[#C4B5FD]",
    accentSoft: "bg-[#6C3FC5]/20 text-[#DDD6FE]",
    chip: "bg-[#6C3FC5]/20 text-[#DDD6FE]",
    chipText: "text-[#DDD6FE]",
    modeLabel: "Foco",
    subLabel: "Mantenha a concentração",
    ring: "border-[#6C3FC5]/25 bg-[#6C3FC5]/10",
  };
}
