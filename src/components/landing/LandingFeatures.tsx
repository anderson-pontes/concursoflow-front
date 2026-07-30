import { Check } from "lucide-react";

import dashboardSrc from "@/assets/dashboard.png";
import { LandingShot } from "@/components/landing/LandingShot";

const checklist = [
  "Acompanhamento do cronograma do edital",
  "Registro de horas estudadas e metas diárias",
  "Indicadores de acertos e evolução por assunto",
  "Revisões e prazos (avisos) no mesmo lugar",
] as const;

export function LandingFeatures() {
  return (
    <section
      id="recursos"
      className="scroll-mt-20 bg-background py-16 md:py-24"
      aria-labelledby="recursos-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">O que o sistema entrega</p>
          <h2
            id="recursos-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Mais organização para quem segue um edital e precisa ver evolução de verdade.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Centralize o acompanhamento — sem depender só de anotações ou planilhas dispersas.
          </p>
          <ul className="mt-8 list-none space-y-3.5">
            {checklist.map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
                  <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <LandingShot
          src={dashboardSrc}
          alt="Dashboard Click Edital com métricas, heatmap e plano do dia"
          className="aspect-[16/10]"
          position="object-center"
        />
      </div>
    </section>
  );
}
