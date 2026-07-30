import { CalendarCheck, Clock, Target } from "lucide-react";

const fichas = [
  {
    n: "01",
    icon: Target,
    title: "Acertos",
    body: "por disciplina e por prova",
    benefit: "Indicadores claros de evolução",
  },
  {
    n: "02",
    icon: Clock,
    title: "Horas",
    body: "registradas e acumuladas",
    benefit: "Mais controle da rotina",
  },
  {
    n: "03",
    icon: CalendarCheck,
    title: "Cronograma",
    body: "seguindo o edital",
    benefit: "Foco no cronograma do edital",
  },
] as const;

export function LandingValueStrip() {
  return (
    <section className="border-y border-border/60 bg-background py-12 md:py-16" aria-labelledby="destaques-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Na prática</p>
          <h2
            id="destaques-heading"
            className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl"
          >
            Tudo o que você acompanha no painel, em um só lugar.
          </h2>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-0 divide-y divide-border sm:mt-12 sm:grid-cols-3 sm:gap-8 sm:divide-y-0 sm:divide-x sm:divide-border">
          {fichas.map(({ n, icon: Icon, title, body, benefit }) => (
            <li key={n} className="py-6 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
              <span className="text-sm font-semibold tabular-nums text-primary">{n}</span>
              <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              <p className="mt-4 border-l-2 border-primary pl-3 text-sm font-medium leading-snug text-foreground">
                {benefit}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
