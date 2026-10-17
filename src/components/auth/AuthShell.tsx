import React from "react";
import { useLocation } from "react-router-dom";

import markPreload from "@/assets/brand/click-edital-mark.svg";
import { AuthHeroVisual } from "@/components/auth/AuthHeroVisual";
import { ClickEditalLogo } from "@/components/branding/ClickEditalLogo";
import { BookOpenCheck, CalendarDays, Target } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  logoAsLink?: boolean;
};

const HERO_FEATURES = [
  { icon: CalendarDays, text: "Planejamento inteligente" },
  { icon: BookOpenCheck, text: "Revisões e acompanhamento" },
  { icon: Target, text: "Evolução do aprendizado" },
] as const;

/**
 * Layout auth: hero Click Edital + coluna do formulário.
 * Mobile: faixa compacta com logo; desktop: split 50/50.
 */
export function AuthShell({ children, logoAsLink = false }: AuthShellProps) {
  const { pathname } = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

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
    preload.href = markPreload;
    document.head.appendChild(preload);
    return () => preload.remove();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden font-sans md:flex-row">
      {/* Mobile — faixa com logo em chip claro (marca legível) */}
      <div className="auth-hero-gradient flex shrink-0 items-center px-4 py-2.5 md:hidden">
        <div className="rounded-xl bg-white/95 dark:bg-surface px-3 py-1.5 shadow-sm">
          <ClickEditalLogo size="sm" className="shrink-0" asLink={logoAsLink} />
        </div>
      </div>

      {/* Desktop — coluna hero */}
      <aside className="auth-hero-gradient relative hidden h-[100dvh] w-[55%] flex-col overflow-hidden md:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-violet-200/20 blur-xl" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-300/20 blur-3xl" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <div className="shrink-0 px-8 pb-0 pt-8 lg:px-10">
            <div className="inline-flex rounded-2xl bg-white/95 dark:bg-surface px-4 py-2.5 shadow-md">
              <ClickEditalLogo size="md" className="shrink-0" asLink={logoAsLink} />
            </div>
            <div className="h-8" aria-hidden />
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden px-8 lg:px-10">
            <h2 className="auth-hero-headline max-w-[420px] text-2xl font-extrabold leading-tight text-white lg:text-3xl">
              Sua aprovação começa com{" "}
              <span className="border-b-[3px] border-white/40 pb-0.5">organização</span>.
            </h2>
            <p className="mt-2 max-w-[380px] text-sm leading-relaxed text-white/75">
              Planeje o edital, acompanhe disciplinas e mantenha o ritmo até a prova — com Click Edital.
            </p>

            <div className="flex min-h-0 items-center justify-center overflow-hidden py-3">
              <AuthHeroVisual />
            </div>
          </div>

          <div className="auth-hero-features mt-auto grid shrink-0 grid-cols-3 gap-2 px-8 pb-8 lg:px-10">
            {HERO_FEATURES.map((item) => (
              <div
                key={item.text}
                className="auth-hero-feature-item flex min-w-0 flex-col items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-md"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white"
                  aria-hidden
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium leading-snug text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Coluna formulário */}
      <main ref={mainRef} className="auth-form-col-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-background md:h-[100dvh] md:w-[45%]">
        <div className="flex min-h-full shrink-0 flex-col items-center justify-start px-4 py-8 sm:px-6 md:justify-center md:px-12 lg:px-16">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="pointer-events-none shrink-0 px-4 pb-4 pt-2 text-center text-[11px] text-muted-foreground sm:pb-6">
          © 2026 Click Edital · Todos os direitos reservados
        </p>
      </main>
    </div>
  );
}
