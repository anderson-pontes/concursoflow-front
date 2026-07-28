import { Link } from "react-router-dom";

import { LandingLogo } from "@/components/landing/LandingLogo";

function HeroAgendaVisual() {
  const dias = [
    { d: "Seg", label: "Direito Const.", tom: "bg-primary-600" },
    { d: "Ter", label: "Português", tom: "bg-primary-500" },
    { d: "Qua", label: "Revisão", tom: "bg-primary-400" },
    { d: "Qui", label: "Questões", tom: "bg-primary-700" },
    { d: "Sex", label: "Flashcards", tom: "bg-primary-500" },
  ];

  return (
    <div
      className="relative flex h-full min-h-[240px] w-full items-end justify-end motion-safe:animate-[landing-fade-in_0.7s_ease-out_0.2s_both] md:min-h-0"
      aria-hidden
    >
      <div className="pointer-events-none absolute -right-16 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-primary-300/30 blur-3xl" />

      <div className="relative w-full max-w-lg border-l border-t border-primary-200/80 bg-surface/90 p-5 shadow-lg backdrop-blur-sm sm:p-6 md:max-w-none md:rounded-l-2xl md:pr-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Agenda da semana</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {dias.map((item) => (
            <div key={item.d} className="flex flex-col gap-2">
              <div className="text-center text-[10px] font-medium text-muted-foreground sm:text-xs">{item.d}</div>
              <div
                className={`${item.tom} flex min-h-[4.5rem] items-end rounded-lg p-2 text-[10px] font-semibold leading-tight text-white sm:min-h-[5.5rem] sm:text-xs`}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-[80%] rounded-full bg-primary-100" />
          <div className="h-2 w-[60%] rounded-full bg-primary-50" />
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-background to-primary-100/40"
      aria-labelledby="landing-hero-heading"
    >
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:gap-8 md:py-16">
        <div className="md:col-span-5 lg:col-span-5">
          <div className="motion-safe:animate-[landing-fade-up_0.55s_ease-out_both]">
            <LandingLogo size="hero" asLink={false} />
          </div>

          <h1
            id="landing-hero-heading"
            className="mt-4 text-2xl font-semibold tracking-tight text-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.08s_both] sm:text-3xl md:text-4xl"
          >
            Organize seu edital. Estude com um plano claro.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.16s_both] sm:text-lg">
            Cronograma, disciplinas, revisões e prazos — tudo que você precisa para manter o ritmo até a
            prova.
          </p>

          <div className="mt-8 flex flex-col gap-3 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.24s_both] sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
            >
              Criar minha conta
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.3s_both]">
            Feito para quem estuda concurso de verdade.
          </p>
        </div>

        <div className="md:col-span-7 lg:col-span-7 md:justify-self-stretch md:-mr-6 lg:-mr-[max(0px,calc((100vw-72rem)/2))]">
          <HeroAgendaVisual />
        </div>
      </div>
    </section>
  );
}
