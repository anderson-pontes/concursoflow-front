import { CalendarCheck, Clock, Target, TrendingUp } from "lucide-react";

const metrics = [
  {
    icon: Target,
    title: "Acertos por questão",
    body: "Acompanhe o desempenho por assunto e identifique padrões de erro.",
  },
  {
    icon: Clock,
    title: "Horas registradas",
    body: "Monitore o volume de estudo e mantenha a constância ao longo do edital.",
  },
  {
    icon: CalendarCheck,
    title: "Cronograma do edital",
    body: "Veja o que já foi concluído e o que ainda precisa entrar na rotina.",
  },
  {
    icon: TrendingUp,
    title: "Progresso real",
    body: "Entenda se você está avançando de forma consistente ou precisa ajustar.",
  },
] as const;

export function LandingMetrics() {
  return (
    <section
      id="indicadores"
      className="scroll-mt-20 bg-surface py-16 md:py-24"
      aria-labelledby="indicadores-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Indicadores que fazem diferença
          </p>
          <h2
            id="indicadores-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Acompanhe seu progresso e ajuste a rotina com base no que você realmente estudou.
          </h2>
          <p className="mt-3 text-muted-foreground">
            O ClickEdital transforma seus registros em uma visão prática — para manter o ritmo e evitar
            improviso.
          </p>
        </div>

        <ul className="mt-14 grid list-none gap-x-10 gap-y-12 sm:grid-cols-2">
          {metrics.map(({ icon: Icon, title, body }) => (
            <li key={title} className="relative pl-0">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
