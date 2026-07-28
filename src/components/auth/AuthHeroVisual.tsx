import markSrc from "@/assets/brand/click-edital-mark.svg";
import { cn } from "@/lib/utils";

const CHECKS = [
  { label: "Edital mapeado", done: true },
  { label: "Cronograma da semana", done: true },
  { label: "Revisão agendada", done: false },
] as const;

/**
 * Visual do hero auth — produto Click Edital (substitui mascote legado).
 */
export function AuthHeroVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] motion-safe:animate-[auth-hero-rise_0.7s_ease-out_both]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute -left-8 top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary-300/40 blur-2xl" />

      {/* Card principal — preview do plano */}
      <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/95 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <img
            src={markSrc}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
            decoding="async"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Seu plano</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">Edital em um clique</p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary">
            64%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-100">
          <div
            className="h-full w-[64%] rounded-full bg-gradient-to-r from-primary-600 to-primary-400 motion-safe:animate-[auth-progress-fill_1.1s_ease-out_0.2s_both]"
          />
        </div>

        <ul className="mt-4 space-y-2.5">
          {CHECKS.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-sm text-foreground">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  item.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-primary-200 bg-primary-50 text-primary/50",
                )}
              >
                {item.done ? "✓" : ""}
              </span>
              <span className={cn(!item.done && "text-muted-foreground")}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chip flutuante — próximo bloco */}
      <div className="absolute -bottom-3 -right-2 flex items-center gap-2 rounded-xl border border-white/30 bg-primary px-3 py-2 shadow-lg motion-safe:animate-[auth-chip-float_3s_ease-in-out_infinite] sm:-right-4">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-[10px] font-bold text-primary-foreground"
          aria-hidden
        >
          →
        </span>
        <span className="text-xs font-semibold text-primary-foreground">Próximo bloco · 25 min</span>
      </div>
    </div>
  );
}
