import { Link } from "react-router-dom";
import { Mail, Youtube } from "lucide-react";

import { LandingLogo } from "@/components/landing/LandingLogo";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:justify-between">
        <div>
          <LandingLogo size="header" />
          <p className="mt-2 text-sm text-muted-foreground">
            Seu edital e sua rotina de estudos em um só lugar.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
          <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm">
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground">
              Como funciona
            </a>
            <a href="#indicadores" className="text-muted-foreground hover:text-foreground">
              Indicadores
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">
              FAQ
            </a>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <a href="#oferta" className="text-muted-foreground hover:text-foreground">
              Assinar
            </a>
          </nav>

          <section aria-labelledby="landing-contact-title" className="min-w-0">
            <h2 id="landing-contact-title" className="text-sm font-semibold text-foreground">
              Contato
            </h2>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <a
                href="mailto:clickedital@gmail.com"
                className="inline-flex min-h-8 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                clickedital@gmail.com
              </a>
              <a
                href="https://www.youtube.com/@clickedital"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Canal @clickedital no YouTube, abre em nova aba"
              >
                <Youtube className="h-4 w-4 shrink-0" aria-hidden />
                YouTube @clickedital
              </a>
            </div>
          </section>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
        © {year} ClickEdital
      </p>
    </footer>
  );
}
