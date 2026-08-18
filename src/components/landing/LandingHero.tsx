import { ArrowRight, CheckCircle2, Clock3, Flame } from "lucide-react";
import { Link } from "react-router-dom";

import dashboardSrc from "@/assets/dashboard.png";
import mascotSrc from "@/assets/mascote.svg";
import { HandDrawnAccent } from "@/components/landing/HandDrawnAccent";
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
          <p className="inline-flex items-center rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur motion-safe:animate-[landing-fade-up_0.55s_ease-out_both]">
            Planejamento para quem estuda para concursos
          </p>
          <div className="mt-5 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.04s_both]"><LandingLogo size="hero" asLink={false} /></div>
          <h1 id="landing-hero-heading" className="relative isolate mt-6 font-display text-4xl font-bold leading-[1.06] tracking-[-0.04em] text-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.08s_both] sm:text-5xl lg:text-[3.6rem]">
            <span className="relative z-10 block">
              Transforme o edital do seu concurso em um plano de estudos{" "}
              <span className="text-primary">claro e organizado.</span>
            </span>
            <HandDrawnAccent
              variant="swoop"
              className="pointer-events-none absolute -bottom-4 left-0 z-0 h-4 w-full overflow-visible text-yellow-400 sm:-left-10 sm:bottom-auto sm:top-[49%] sm:h-[43%] sm:w-[calc(100%+5rem)]"
            />
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.16s_both] sm:text-lg">
            Cadastre as disciplinas e os tópicos do seu edital, organize suas prioridades e acompanhe horas estudadas, revisões, questões e evolução em um único lugar.
          </p>
          <div className="mt-9 flex flex-col gap-3 motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.24s_both] sm:flex-row sm:items-center">
            <Link to="/register" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 outline-none transition hover:-translate-y-0.5 hover:bg-primary-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring">Organizar meus estudos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
            <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/15 bg-white/80 px-6 text-sm font-semibold text-foreground shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring">Ver como funciona</a>
          </div>
          <ul className="mt-6 list-none space-y-2 text-sm text-muted-foreground motion-safe:animate-[landing-fade-up_0.55s_ease-out_0.3s_both]">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />Tenha clareza sobre o que estudar.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />Saiba o que já concluiu e o que ainda falta.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />Acompanhe sua evolução até a prova.</li>
          </ul>
        </div>

        <div className="motion-safe:animate-[landing-fade-in_0.7s_ease-out_0.15s_both] md:col-span-6 lg:col-span-7 md:justify-self-stretch">
          <div className="relative mx-auto max-w-3xl pb-10 pt-8 sm:px-8">
            <div className="pointer-events-none absolute inset-5 -rotate-2 rounded-[2.5rem] bg-primary/10" aria-hidden />
            <LandingShot src={dashboardSrc} alt="Painel ClickEdital com cronograma da semana, métricas e heatmap de estudos" className="relative aspect-[16/10] rotate-[1deg] rounded-2xl border-4 border-white shadow-xl shadow-primary/20 transition-transform duration-500 hover:rotate-0 hover:scale-[1.01]" position="object-left-top" priority />
            <div className="landing-float-slow absolute -left-1 top-0 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 pr-5 shadow-xl backdrop-blur sm:left-0"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Flame className="h-5 w-5" aria-hidden /></span><span><strong className="block text-sm text-foreground">12 dias de foco</strong><small className="text-muted-foreground">Continue assim!</small></span></div>
            <div className="landing-float absolute -bottom-1 right-2 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 pr-5 shadow-xl backdrop-blur sm:right-0"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Clock3 className="h-5 w-5" aria-hidden /></span><span><strong className="block text-sm text-foreground">Meta do dia</strong><small className="text-emerald-600">2h 30min concluídas</small></span></div>
            <img src={mascotSrc} alt="" className="landing-mascot-bob pointer-events-none absolute -right-4 -top-2 hidden h-28 w-24 object-contain lg:block" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
