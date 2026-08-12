import { BookOpenCheck, ClipboardList, ListTodo, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { HandDrawnAccent } from "@/components/landing/HandDrawnAccent";

const steps = [
  { n: "01", icon: ClipboardList, title: "Cadastre seu concurso", body: "Informe o concurso que está estudando e cadastre as disciplinas e os tópicos previstos no edital." },
  { n: "02", icon: ListTodo, title: "Organize suas prioridades", body: "Defina pesos, níveis de domínio, metas e prioridades para concentrar seu tempo nos assuntos mais importantes." },
  { n: "03", icon: BookOpenCheck, title: "Registre seus estudos", body: "Registre horas, sessões de foco, revisões e questões resolvidas sem depender de várias planilhas ou anotações." },
  { n: "04", icon: TrendingUp, title: "Acompanhe e ajuste", body: "Veja o que foi estudado, acompanhe o cumprimento do plano e identifique os assuntos que precisam voltar à rotina." },
] as const;

export function LandingSteps() {
  return (
    <section id="como-funciona" className="relative scroll-mt-20 overflow-hidden bg-primary-50 py-20 md:py-28" aria-labelledby="como-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Como funciona na prática</p>
          <h2 id="como-heading" className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Do edital à rotina de estudos em{" "}
            <span className="relative isolate inline-block">
              <span className="relative z-10">poucos passos</span>
              <HandDrawnAccent variant="underline" className="absolute -bottom-7 left-0 z-0 h-9 w-full text-primary/55" />
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">O ClickEdital transforma o conteúdo do seu concurso em uma rotina que você consegue acompanhar e ajustar.</p>
        </div>
        <ol className="relative mt-14 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-10 hidden border-t-2 border-dashed border-primary/25 lg:block" aria-hidden />
          {steps.map((step, index) => (
            <li key={step.n} className="group relative rounded-2xl border border-primary/10 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="absolute right-5 top-4 text-4xl font-black text-primary/10">{step.n}</span>
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform group-hover:rotate-3 group-hover:scale-105"><step.icon className="h-6 w-6" aria-hidden /></span>
              <h3 className="mt-5 text-lg font-bold text-foreground">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p><span className="mt-5 block text-xs font-bold uppercase tracking-wider text-primary">Etapa {index + 1}</span>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center"><Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition hover:-translate-y-0.5 hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring">Começar a organizar meu edital</Link></div>
      </div>
    </section>
  );
}
