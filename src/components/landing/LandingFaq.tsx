import React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Como recebo o acesso?",
    a: "Após a confirmação do pagamento, sua assinatura é liberada. Você entra no ClickEdital com o e-mail e a senha cadastrados e recebe as orientações para acessar o bônus digital.",
  },
  {
    q: "Quais Mapas de TI estão incluídos no bônus?",
    a: "O conteúdo reúne mapas de Dados e Inteligência, Gestão e Metodologias, Segurança, Banco de Dados, Governança, Redes e Cloud — incluindo assuntos como Big Data, Machine Learning, Agile, LGPD, SQL, NoSQL, ITIL 4, COBIT 2019, TCP/IP e Cloud Computing.",
  },
  {
    q: "Em qual formato recebo os mapas?",
    a: "O material é digital, com mais de 100 páginas, disponibilizado em PDF e também em imagens de alta resolução. O pacote inclui atualizações por 1 ano.",
  },
  {
    q: "Serve para quem está começando?",
    a: "Sim. O ClickEdital ajuda a organizar o edital e a rotina desde o início, e os mapas facilitam a visualização e a revisão dos principais assuntos de TI.",
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
