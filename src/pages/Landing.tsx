import React from "react";
import { Navigate } from "react-router-dom";

import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSteps } from "@/components/landing/LandingSteps";
import { LandingTrust } from "@/components/landing/LandingTrust";
import { useAuthStore } from "@/stores/authStore";

const PAGE_TITLE = "Click Edital — Organize seus estudos para concursos";
const PAGE_DESCRIPTION =
  "Planeje o edital, acompanhe disciplinas, revise com flashcards e controle prazos. Click Edital: seu plano de concurso em um só lugar.";

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
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo-principal">
        <LandingHero />
        <LandingFeatures />
        <LandingSteps />
        <LandingTrust />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
