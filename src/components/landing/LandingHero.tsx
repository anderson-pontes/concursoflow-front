import { ArrowRight, CheckCircle2, Clock3, Flame, Sparkles } from "lucide-react";

import dashboardSrc from "@/assets/dashboard.png";
import mascotSrc from "@/assets/mascote.svg";
import { LandingLogo } from "@/components/landing/LandingLogo";
import { LandingShot } from "@/components/landing/LandingShot";

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-50 via-background to-emerald-50" aria-labelledby="landing-hero-heading">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-12 md:py-20 lg:gap-16">
        <div className="md:col-span-6 lg:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur motion-safe:animate-[landing-fade-up_0.55s_ease-out_both]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Agora com os Mapas de TI da Déia de bônus
          </p>
          <div className="mt-5 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.04s_both]"><LandingLogo size="hero" asLink={false} /></div>
          <h1 id="landing-hero-heading" className="mt-6 font-display text-4xl font-bold leading-[1.06] tracking-[-0.04em] text-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.08s_both] sm:text-5xl lg:text-[3.6rem]">
            Organize o edital. <span className="relative whitespace-nowrap text-primary">Revise melhor
              <svg className="absolute -bottom-2 left-0 w-full text-amber-400" viewBox="0 0 220 12" fill="none" aria-hidden><path d="M3 8C54 2 144 2 217 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>
            </span>{" "}e avance com clareza.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.16s_both] sm:text-lg">
            O ClickEdital transforma matérias, metas e desempenho em um plano visual. Na assinatura anual, você ainda leva os Mapas de TI da Déia para acelerar suas revisões.
          </p>
          <div className="mt-9 flex flex-col gap-3 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.24s_both] sm:flex-row sm:items-center">
            <a href="#oferta" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 outline-none transition hover:-translate-y-0.5 hover:bg-primary-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring">Começar minha jornada <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></a>
            <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/15 bg-white/80 px-6 text-sm font-semibold text-foreground shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring">Ver como funciona</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.3s_both]">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />7 dias de garantia</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />Bônus digital sem custo adicional</span>
          </div>
        </div>

        <div className="motion-safe:animate-[landing-fade-in_0.7s_ease-out_0.15s_both] md:col-span-6 lg:col-span-7 md:justify-self-stretch">
          <div className="relative mx-auto max-w-3xl pb-10 pt-8 sm:px-8">
            <div className="pointer-events-none absolute inset-5 -rotate-2 rounded-[2.5rem] bg-primary/10" aria-hidden />
            <LandingShot src={dashboardSrc} alt="Painel Click Edital com cronograma da semana, métricas e heatmap de estudos" className="relative aspect-[16/10] rotate-[1deg] rounded-2xl border-4 border-white shadow-xl shadow-primary/20 transition-transform duration-500 hover:rotate-0 hover:scale-[1.01]" position="object-left-top" priority />
            <div className="landing-float-slow absolute -left-1 top-0 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 pr-5 shadow-xl backdrop-blur sm:left-0"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Flame className="h-5 w-5" aria-hidden /></span><span><strong className="block text-sm text-foreground">12 dias de foco</strong><small className="text-muted-foreground">Continue assim!</small></span></div>
            <div className="landing-float absolute -bottom-1 right-2 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 pr-5 shadow-xl backdrop-blur sm:right-0"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Clock3 className="h-5 w-5" aria-hidden /></span><span><strong className="block text-sm text-foreground">Meta do dia</strong><small className="text-emerald-600">2h 30min concluídas</small></span></div>
            <img src={mascotSrc} alt="" className="landing-mascot-bob pointer-events-none absolute -right-4 -top-2 hidden h-28 w-24 object-contain lg:block" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
