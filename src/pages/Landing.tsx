import React from "react";
import { Navigate } from "react-router-dom";

import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMetrics } from "@/components/landing/LandingMetrics";
import { LandingMapsBonus } from "@/components/landing/LandingMapsBonus";
import { LandingObjections } from "@/components/landing/LandingObjections";
import { LandingOffer } from "@/components/landing/LandingOffer";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { LandingSteps } from "@/components/landing/LandingSteps";
import { LandingValueStrip } from "@/components/landing/LandingValueStrip";
import { useAuthStore } from "@/stores/authStore";

const PAGE_TITLE = "ClickEdital — Organize seu edital e acompanhe seus estudos";
const PAGE_DESCRIPTION =
  "Cadastre as disciplinas e os tópicos do seu edital, organize prioridades e acompanhe horas, revisões, questões e evolução em um só lugar.";

function useLandingSeo() {
  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const prevDesc = meta.getAttribute("content");
    meta.setAttribute("content", PAGE_DESCRIPTION);

    return () => {
      document.title = prevTitle;
      if (created && meta?.parentNode) meta.parentNode.removeChild(meta);
      else if (meta && prevDesc != null) meta.setAttribute("content", prevDesc);
    };
  }, []);
}

export function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(accessToken);
  useLandingSeo();

  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-playful min-h-screen overflow-x-hidden bg-background text-foreground">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo-principal">
        <LandingHero />
        <LandingSteps />
        <LandingObjections />
        <LandingShowcase />
        <LandingValueStrip />
        <LandingMetrics />
        <LandingFeatures />
        <LandingMapsBonus />
        <LandingOffer />
        <LandingFaq />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
