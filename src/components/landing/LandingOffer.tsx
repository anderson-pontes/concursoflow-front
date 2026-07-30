import { Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";

const bullets = [
  "Cronograma conectado ao seu edital",
  "Registro rápido de horas de estudo",
  "Indicadores de acertos por assunto",
  "Painel visual claro para a rotina",
] as const;

export function LandingOffer() {
  return (
    <section
      id="oferta"
      className="scroll-mt-20 bg-primary-50/80 py-16 md:py-24"
      aria-labelledby="oferta-heading"
    >
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-lg md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Assinatura anual</p>
          <h2
            id="oferta-heading"
            className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl"
          >
            Tenha um painel claro do seu estudo e siga o plano com mais foco.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            12 meses de acesso para organizar o cronograma, registrar horas e acompanhar acertos.
          </p>

          <div className="mt-8 rounded-xl border border-primary/20 bg-primary-muted px-5 py-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Plano anual</p>
            <p className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-lg font-semibold text-foreground">R$</span>
              <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums md:text-6xl">
                149
              </span>
              <span className="text-2xl font-bold text-foreground">,00</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">por ano</p>
            <p className="mt-3 text-base font-semibold text-primary">
              em até <span className="tabular-nums">10x</span> de{" "}
              <span className="tabular-nums">R$&nbsp;14,90</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Pagamento seguro · acesso após confirmação
            </p>
          </div>

          <ul className="mt-8 list-none space-y-3">
            {bullets.map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-sm font-medium text-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>Garantia de satisfação de 7 dias</span>
            </li>
          </ul>

          <Link
            to="/register"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Quero assinar agora
          </Link>
        </div>
      </div>
    </section>
  );
}
