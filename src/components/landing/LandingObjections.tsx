import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Visualize todo o conteúdo do edital.",
  "Descubra quais assuntos precisam de mais atenção.",
  "Organize metas compatíveis com a sua rotina.",
  "Não perca prazos e revisões importantes.",
  "Acompanhe horas estudadas e questões resolvidas.",
  "Ajuste o planejamento com base no seu desempenho.",
] as const;

export function LandingObjections() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="objecoes-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Decida com clareza</p>
          <h2
            id="objecoes-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Pare de estudar sem saber se está realmente avançando
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Quando o edital está espalhado entre PDFs, planilhas e anotações, fica difícil saber o que priorizar. O ClickEdital centraliza sua preparação e transforma seus registros em decisões mais claras.
          </p>
        </div>

        <ul className="mt-12 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-foreground shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
