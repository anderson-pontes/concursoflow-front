import dashboardSrc from "@/assets/dashboard.png";
import { LandingLogo } from "@/components/landing/LandingLogo";
import { LandingShot } from "@/components/landing/LandingShot";

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-background to-primary-100/50"
      aria-labelledby="landing-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(124,58,237,0.12),transparent_55%)]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:gap-10 md:py-16 lg:gap-12">
        <div className="md:col-span-5 lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary motion-safe:animate-[landing-fade-up_0.55s_ease-out_both]">
            Planejador de estudos e cronograma para concursos
          </p>

          <div className="mt-4 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.04s_both]">
            <LandingLogo size="hero" asLink={false} />
          </div>

          <h1
            id="landing-hero-heading"
            className="mt-5 font-display text-3xl leading-[1.15] tracking-tight text-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.08s_both] sm:text-4xl md:text-[2.75rem]"
          >
            Organize seu plano de estudos e siga o{" "}
            <span className="text-primary">edital</span> com mais clareza.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.16s_both] sm:text-lg">
            Use um painel simples para registrar horas, acompanhar o avanço e ver o que ainda falta — sem
            depender de planilhas ou memória.
          </p>

          <div className="mt-9 flex flex-col gap-3 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.24s_both] sm:flex-row sm:items-center">
            <a
              href="#oferta"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
            >
              Quero assinar agora
            </a>
            <a
              href="#como-funciona"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface/80 px-6 text-sm font-semibold text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver como funciona
            </a>
          </div>
          <p className="mt-5 text-sm text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.3s_both]">
            Feito para quem estuda concurso de verdade.
          </p>
        </div>

        <div className="motion-safe:animate-[landing-fade-in_0.7s_ease-out_0.15s_both] md:col-span-7 lg:col-span-7 md:justify-self-stretch md:-mr-6 lg:-mr-[max(0px,calc((100vw-72rem)/2))]">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden />
            <LandingShot
              src={dashboardSrc}
              alt="Painel Click Edital com cronograma da semana, métricas e heatmap de estudos"
              className="aspect-[16/10] md:aspect-[5/3] md:rounded-l-2xl md:rounded-r-none md:ring-0"
              position="object-left-top"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
