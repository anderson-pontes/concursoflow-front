import { Link } from "react-router-dom";

import { LandingLogo } from "@/components/landing/LandingLogo";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:justify-between">
        <div>
          <LandingLogo size="header" />
          <p className="mt-2 text-sm text-muted-foreground">Estudo de concurso, organizado.</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
          <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm">
            <a href="#recursos" className="text-muted-foreground hover:text-foreground">
              Recursos
            </a>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground">
              Como funciona
            </a>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link to="/register" className="text-muted-foreground hover:text-foreground">
              Criar conta
            </Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-2 text-sm">
            <a href="#termo" className="text-muted-foreground hover:text-foreground" onClick={(e) => e.preventDefault()}>
              Termos
            </a>
            <a
              href="#privacidade"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => e.preventDefault()}
            >
              Privacidade
            </a>
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
        © {year} Click Edital
      </p>
    </footer>
  );
}
