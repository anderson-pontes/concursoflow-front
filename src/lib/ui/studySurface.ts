/** Shared Modern Indigo surfaces. Theme values live in index.css. */
export type StudyTone = "indigo" | "violet" | "cyan" | "emerald" | "amber" | "coral";
export const studyToneClasses: Record<StudyTone, string> = {
  indigo: "study-tone-indigo", violet: "study-tone-violet", cyan: "study-tone-cyan",
  emerald: "study-tone-emerald", amber: "study-tone-amber", coral: "study-tone-coral",
};
export function studySurface(tone: StudyTone) {
  return `study-surface ${studyToneClasses[tone]} bg-[var(--study-soft)] text-[color:var(--study-ink)]`;
}
