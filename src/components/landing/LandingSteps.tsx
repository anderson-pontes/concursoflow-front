import { Link } from "react-router-dom";

const steps = [
  {
    n: "01",
    title: "Crie sua conta",
    body: "Cadastro rápido e acesso ao seu espaço de estudos.",
  },
  {
    n: "02",
    title: "Defina o concurso",
    body: "Informe o concurso (ou os concursos) e as disciplinas do edital.",
  },
  {
    n: "03",
    title: "Estude no ritmo",
    body: "Use cronograma, registre sessões e revise com o ciclo que você configurar.",
  },
] as const;

export function LandingSteps() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 bg-surface-muted py-16 md:py-24"
      aria-labelledby="como-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 id="como-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Três passos para começar
        </h2>
        <p className="mt-2 text-muted-foreground">Do cadastro ao primeiro dia de estudo organizado.</p>

        <ol className="mt-12 grid list-none gap-10 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-border pt-6 sm:border-t-0 sm:pt-0">
              <span className="text-sm font-bold tabular-nums text-primary">{s.n}</span>
              <h3 className="mt-2 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Começar agora
          </Link>
        </div>
      </div>
    </section>
  );
}
