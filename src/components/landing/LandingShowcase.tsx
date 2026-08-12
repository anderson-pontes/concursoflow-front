import disciplinaSrc from "@/assets/disciplina.png";
import pomodoroSrc from "@/assets/pomodoro.png";
import registroSrc from "@/assets/registro_estudo.png";
import { LandingShot } from "@/components/landing/LandingShot";
import { cn } from "@/lib/utils";

const shots = [
  {
    src: disciplinaSrc,
    alt: "Dashboard de disciplina com edital verticalizado, pesos e domínio",
    label: "Disciplinas",
    title: "Edital verticalizado com prioridade e domínio",
    body: "Acompanhe tópicos, peso e quanto já avançou — sem perder o fio do concurso.",
    fit: "cover" as const,
    aspect: "aspect-[16/10]",
  },
  {
    src: pomodoroSrc,
    alt: "Timer Pomodoro com disciplina selecionada e sessão de foco",
    label: "Foco",
    title: "Sessões com Pomodoro no ritmo certo",
    body: "Escolha disciplina e duração, inicie a sessão e mantenha o foco no que importa.",
    fit: "contain" as const,
    aspect: "aspect-[4/5] sm:aspect-[3/4]",
  },
  {
    src: registroSrc,
    alt: "Modal de registro de estudo com tempo, categoria e tópicos",
    label: "Registro",
    title: "Registre horas e tópicos em poucos cliques",
    body: "Categoria, tempo e checklist de tópicos — o histórico alimenta seus indicadores.",
    fit: "contain" as const,
    aspect: "aspect-[4/5] sm:aspect-[3/4]",
  },
] as const;

/**
 * Vitrine de produto — screenshots em faixas narrativas (zigzag).
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
            Telas reais do ClickEdital — o mesmo ambiente que você usa depois de assinar.
          </p>
        </div>

        <ol className="mt-14 list-none space-y-16 md:mt-16 md:space-y-24">
          {shots.map((shot, index) => {
            const reverse = index % 2 === 1;
            return (
              <li
                key={shot.label}
                className="grid items-center gap-8 md:grid-cols-12 md:gap-10 lg:gap-14"
              >
                <div className={cn("md:col-span-5", reverse && "md:order-2")}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-muted tabular-nums text-[11px] text-primary"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {shot.label}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {shot.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                    {shot.body}
                  </p>
                </div>

                <div className={cn("md:col-span-7", reverse && "md:order-1")}>
                  <LandingShot
                    src={shot.src}
                    alt={shot.alt}
                    fit={shot.fit}
                    className={cn(
                      shot.aspect,
                      shot.fit === "contain"
                        ? "mx-auto w-full max-w-[22rem] sm:max-w-md"
                        : "w-full",
                    )}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
