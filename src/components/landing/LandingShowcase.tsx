import disciplinaSrc from "@/assets/disciplina.png";
import pomodoroSrc from "@/assets/pomodoro.png";
import registroSrc from "@/assets/registro_estudo.png";
import { LandingShot } from "@/components/landing/LandingShot";

const shots = [
  {
    src: disciplinaSrc,
    alt: "Dashboard de disciplina com edital verticalizado, pesos e domínio",
    label: "Disciplinas",
    title: "Edital verticalizado com prioridade e domínio",
    body: "Acompanhe tópicos, peso e quanto já avançou — sem perder o fio do concurso.",
  },
  {
    src: pomodoroSrc,
    alt: "Timer Pomodoro com disciplina selecionada e sessão de foco",
    label: "Foco",
    title: "Sessões com Pomodoro no ritmo certo",
    body: "Escolha disciplina e duração, inicie a sessão e mantenha o foco no que importa.",
  },
  {
    src: registroSrc,
    alt: "Modal de registro de estudo com tempo, categoria e tópicos",
    label: "Registro",
    title: "Registre horas e tópicos em poucos cliques",
    body: "Categoria, tempo e checklist de tópicos — o histórico alimenta seus indicadores.",
  },
] as const;

/**
 * Vitrine de produto — screenshots reais abaixo do hero.
 */
export function LandingShowcase() {
  return (
    <section
      id="produto"
      className="scroll-mt-20 border-y border-border/60 bg-gradient-to-b from-primary-50/40 via-background to-background py-16 md:py-24"
      aria-labelledby="produto-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Painel do produto</p>
          <h2
            id="produto-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Veja o cronograma, as disciplinas e o foco em ação.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Telas reais do Click Edital — o mesmo ambiente que você usa depois de assinar.
          </p>
        </div>

        {/* Destaque: disciplina */}
        <div className="mt-14 grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{shots[0].label}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {shots[0].title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{shots[0].body}</p>
          </div>
          <div className="md:col-span-7">
            <LandingShot src={shots[0].src} alt={shots[0].alt} className="aspect-[16/10]" />
          </div>
        </div>

        {/* Dupla: pomodoro + registro */}
        <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-8">
          {shots.slice(1).map((shot) => (
            <article key={shot.label} className="flex flex-col gap-5">
              <LandingShot src={shot.src} alt={shot.alt} className="aspect-[4/3]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{shot.label}</p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">{shot.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shot.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
