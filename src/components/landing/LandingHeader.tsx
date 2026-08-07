import React from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { LandingLogo } from "@/components/landing/LandingLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#bonus-mapas", label: "Bônus de mapas" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-shadow",
        scrolled
          ? "border-border bg-surface/90 shadow-sm backdrop-blur-md"
          : "border-transparent bg-surface/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <LandingLogo size="header" />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Entrar
          </Link>
          <a
            href="#oferta"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Quero assinar
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#oferta"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            Quero assinar
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-border bg-surface px-4 py-4 md:hidden"
          role="dialog"
          aria-label="Menu de navegação"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              Entrar
            </Link>
            <a
              href="#oferta"
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              Quero assinar
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
