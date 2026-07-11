import React from "react";

import aprovinhoUrl from "@/assets/brand/aprovinho.webp";
import logoPreload from "@/assets/brand/logo2.webp";
import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
};

const HERO_FEATURES = [
  { tone: "bg-success text-white", icon: "✓", text: "+1.200 concurseiros já usam" },
  { tone: "bg-warning text-white", icon: "⏱", text: "Pomodoro, cronograma e flashcards" },
  { tone: "bg-primary text-primary-foreground", icon: "📊", text: "Heatmap e métricas de evolução" },
] as const;

/**
 * Layout auth: hero (gradiente + mascote) + coluna do formulário.
 * Mobile: faixa compacta com logo; desktop: split 50/50.
 */
export function AuthShell({ children }: AuthShellProps) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  React.useEffect(() => {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = logoPreload;
    document.head.appendChild(preload);
    return () => preload.remove();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden font-sans md:flex-row">
      {/* Mobile — faixa hero compacta */}
      <div className="auth-hero-gradient flex shrink-0 items-center justify-between px-4 py-3 md:hidden">
        <AprovingoLogo className="h-8 w-auto max-w-[160px] shrink-0 brightness-0 invert" />
        <img src={aprovinhoUrl} alt="" className="h-10 w-auto opacity-90" aria-hidden decoding="async" loading="lazy" width={72} height={72} />
      </div>

      {/* Desktop — coluna hero */}
      <aside className="auth-hero-gradient relative hidden h-[100dvh] w-1/2 flex-col overflow-hidden md:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/[0.06]" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <div className="shrink-0 px-8 pb-0 pt-8 lg:px-10">
            <AprovingoLogo className="h-12 w-auto max-w-[220px] brightness-0 invert sm:h-14" />
            <div className="h-8" aria-hidden />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 lg:px-10">
            <h2 className="auth-hero-headline max-w-[420px] text-2xl font-extrabold leading-tight text-white lg:text-3xl">
              Sua aprovação começa com{" "}
              <span className="border-b-[3px] border-white/40 pb-0.5">organização</span>.
            </h2>
            <p className="mt-2 max-w-[380px] text-sm leading-relaxed text-white/75">
              Gerencie seus estudos, acompanhe seu progresso e alcance sua meta com mais foco.
            </p>

            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
              <div className="relative my-4 h-[200px] shrink-0">
                <div className="absolute right-0 top-2 z-10 max-w-[min(100%,260px)] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                  <p className="font-medium italic text-white/95">Aprovinho · a ararinha estudiosa</p>
                </div>
                <div className="flex h-full items-end justify-start">
                  <img
                    src={aprovinhoUrl}
                    alt="Aprovinho"
                    className="auth-hero-mascot auth-mascot-float relative z-0 max-h-[180px] w-auto object-contain drop-shadow-2xl"
                    decoding="async"
                    loading="lazy"
                    width={360}
                    height={197}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="auth-hero-features mt-auto flex shrink-0 flex-col gap-2 px-8 pb-8 lg:px-10">
            {HERO_FEATURES.map((item) => (
              <div
                key={item.text}
                className="auth-hero-feature-item flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md transition-transform hover:translate-x-1 hover:bg-white/15"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    item.tone,
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Coluna formulário */}
      <main className="auth-form-col-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-surface md:h-[100dvh] md:w-1/2">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-12 lg:px-16">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="pointer-events-none shrink-0 px-4 pb-4 pt-2 text-center text-[11px] text-muted-foreground sm:pb-6">
          © 2025 Aprovingo · Todos os direitos reservados
        </p>
      </main>
    </div>
  );
}
