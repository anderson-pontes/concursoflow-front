import { Bell, BookOpen, Calendar, Layers } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Cronograma que você cumpre",
    body: "Monte a semana de estudo e veja o que está agendado — do dia a dia à visão da semana.",
  },
  {
    icon: BookOpen,
    title: "Progresso por disciplina",
    body: "Acompanhe tópicos, prioridade e quanto já avançou no edital do concurso ativo.",
  },
  {
    icon: Layers,
    title: "Revisões que voltam na hora certa",
    body: "Flashcards e ciclos de revisão para não esquecer o que já estudou.",
  },
  {
    icon: Bell,
    title: "Prazos sob controle",
    body: "Avisos de inscrição, prova e outros compromissos do edital, sem surpresa.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="recursos" className="scroll-mt-20 bg-background py-16 md:py-24" aria-labelledby="recursos-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 id="recursos-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          O que você resolve no Click Edital
        </h2>
        <p className="mt-2 text-muted-foreground">Menos improvisação. Mais consistência no estudo.</p>

        <ul className="mt-12 grid list-none gap-10 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
