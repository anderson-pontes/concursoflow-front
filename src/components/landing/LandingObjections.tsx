const objections = [
  {
    quote: "Eu não tenho tempo.",
    answer:
      "Foi pensado para registrar em poucos minutos e manter a rotina organizada sem virar mais uma tarefa.",
  },
  {
    quote: "Eu não sei se vou manter.",
    answer:
      "Com o acompanhamento visual de horas e progresso, fica mais fácil manter a consistência.",
  },
  {
    quote: "Eu preciso de algo simples.",
    answer:
      "A proposta é simples: você registra, acompanha e entende o que precisa melhorar.",
  },
] as const;

export function LandingObjections() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="objecoes-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Mais controle</p>
          <h2
            id="objecoes-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Saiba o que já estudou, o que falta e onde o foco precisa voltar.
          </h2>
        </div>

        <ul className="mt-12 grid list-none gap-8 sm:grid-cols-3">
          {objections.map((item) => (
            <li key={item.quote} className="border-l-2 border-primary pl-4">
              <h3 className="text-base font-medium text-foreground">“{item.quote}”</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
