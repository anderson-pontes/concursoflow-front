import { BookOpenCheck, ListTodo, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { n: "01", icon: ListTodo, title: "Organize o edital", body: "Defina prioridades, monte o cronograma e veja o que merece atenção." },
  { n: "02", icon: BookOpenCheck, title: "Registre cada sessão", body: "Horas, questões e revisões entram no sistema rápido — sem virar outra tarefa." },
  { n: "03", icon: TrendingUp, title: "Acompanhe a evolução", body: "Veja acertos, avanço e o que precisa ajustar antes da prova." },
] as const;

export function LandingSteps() {
  return (
    <section id="como-funciona" className="relative scroll-mt-20 overflow-hidden bg-primary-50 py-20 md:py-28" aria-labelledby="como-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Sua trilha de estudos</p><h2 id="como-heading" className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">Um passo de cada vez. Sem se perder no caminho.</h2><p className="mt-3 text-muted-foreground">Do edital à evolução — tudo conectado em uma rotina possível.</p></div>
        <ol className="relative mt-14 grid list-none gap-6 sm:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-primary/25 sm:block" aria-hidden />
          {steps.map((step, index) => (
            <li key={step.n} className="group relative rounded-2xl border border-primary/10 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="absolute right-5 top-4 text-4xl font-black text-primary/10">{step.n}</span>
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform group-hover:rotate-3 group-hover:scale-105"><step.icon className="h-6 w-6" aria-hidden /></span>
              <h3 className="mt-5 text-lg font-bold text-foreground">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p><span className="mt-5 block text-xs font-bold uppercase tracking-wider text-primary">Etapa {index + 1}</span>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center"><Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition hover:-translate-y-0.5 hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring">Começar agora</Link></div>
      </div>
    </section>
  );
}
