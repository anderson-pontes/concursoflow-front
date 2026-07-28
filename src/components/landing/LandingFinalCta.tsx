import { Link } from "react-router-dom";

export function LandingFinalCta() {
  return (
    <section className="bg-primary-muted py-16 md:py-20" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 id="final-cta-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Pronto para organizar seu edital?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Crie sua conta e monte o plano de estudos em minutos.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Criar minha conta
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Já estudo aqui? Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
