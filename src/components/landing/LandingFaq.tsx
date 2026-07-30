import React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Como recebo o acesso?",
    a: "Após a confirmação do pagamento da assinatura, seu acesso é liberado. Você entra com o e-mail e a senha cadastrados.",
  },
  {
    q: "Serve para quem está começando?",
    a: "Sim. O Click Edital ajuda a organizar o edital e a rotina desde o início — sem precisar de planilha avançada.",
  },
  {
    q: "Tem garantia?",
    a: "Sim. Você tem 7 dias de garantia. Se não fizer sentido para você, falamos sobre o reembolso conforme a política da assinatura.",
  },
  {
    q: "Preciso instalar algo?",
    a: "Não. É uma plataforma web: acesse pelo navegador no computador ou no celular.",
  },
  {
    q: "Posso usar para mais de um concurso?",
    a: "Sim. Você organiza disciplinas e o plano em cima do concurso (ou concursos) que estiver priorizando.",
  },
] as const;

export function LandingFaq() {
  const [open, setOpen] = React.useState<Record<number, boolean>>({});

  const toggle = (i: number) => {
    setOpen((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <section id="faq" className="scroll-mt-20 bg-background py-16 md:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">FAQ</p>
          <h2 id="faq-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-10 divide-y divide-border border-t border-border">
          {faqs.map((item, i) => {
            const isOpen = Boolean(open[i]);
            const panelId = `faq-panel-${i}`;
            const btnId = `faq-btn-${i}`;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    id={btnId}
                    className="flex min-h-12 w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                  >
                    {item.q}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className={cn(!isOpen && "hidden")}
                >
                  <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
