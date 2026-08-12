import { Link } from "react-router-dom";

export function LandingFinalCta() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-muted to-primary-100/80 py-16 md:py-20"
      aria-labelledby="final-cta-heading"
    >
      <div
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2
          id="final-cta-heading"
          className="font-display text-3xl tracking-tight text-foreground md:text-4xl"
        >
          Comece com seu edital e avance com uma rotina mais clara.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Cadastre seu concurso, organize prioridades e acompanhe o que você estuda em um único lugar.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Quero organizar meus estudos
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Já tenho conta? Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
