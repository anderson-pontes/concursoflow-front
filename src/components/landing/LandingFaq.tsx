import React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Preciso cadastrar meu próprio edital?",
    a: "Sim. Você cadastra o concurso e inclui as disciplinas e os tópicos previstos no edital. Também pode anexar o PDF para consulta, mas o conteúdo não é extraído nem preenchido automaticamente.",
  },
  {
    q: "Existem editais prontos disponíveis?",
    a: "Não. O ClickEdital não oferece um catálogo de editais prontos. Você monta a organização com base no edital do concurso que está estudando.",
  },
  {
    q: "O ClickEdital monta meu cronograma automaticamente?",
    a: "Sim, se você escolher o modo automático. Depois de cadastrar o concurso, as disciplinas e os tópicos, informe quantas sessões fará por dia e a duração de cada sessão. O sistema considera as prioridades dos tópicos, mostra uma prévia e só salva depois da sua confirmação. Você também pode usar os modos analítico ou simplificado.",
  },
  {
    q: "Posso organizar mais de um concurso?",
    a: "Sim. Você pode cadastrar vários concursos e vincular disciplinas a um ou mais deles. Um concurso fica ativo por vez para orientar os painéis e registros da rotina.",
  },
  {
    q: "Consigo alterar o cronograma depois?",
    a: "Sim. Depois de gerar ou montar o cronograma, você pode editar horários e blocos, reorganizar a semana ou remover ocorrências conforme sua rotina mudar.",
  },
  {
    q: "O sistema avisa quando preciso revisar um conteúdo?",
    a: "Ao registrar um estudo, você pode programar revisões e acompanhar as próximas revisões no sistema. A área de avisos também ajuda a controlar prazos cadastrados por você; o ClickEdital não deduz datas automaticamente do PDF do edital.",
  },
  {
    q: "Os Mapas de TI estão incluídos em todos os planos?",
    a: "Os Mapas de TI da Déia estão incluídos como bônus na assinatura anual apresentada nesta página, sem custo adicional durante os 12 meses de acesso.",
  },
  {
    q: "O ClickEdital serve para concursos que não possuem disciplinas de TI?",
    a: "Sim. A plataforma organiza concursos de qualquer área. Os Mapas de TI são apenas um bônus complementar para quem estuda conteúdos de Tecnologia da Informação.",
  },
  {
    q: "Posso acessar pelo celular?",
    a: "Sim. O ClickEdital é uma plataforma web responsiva e pode ser acessado pelo navegador no computador, tablet ou celular, sem instalação.",
  },
  {
    q: "O que acontece depois que eu concluo a assinatura?",
    a: "Após a confirmação do pagamento, o acesso anual é liberado para a conta cadastrada. Você entra com seu e-mail e senha, cadastra o concurso e começa a organizar disciplinas, tópicos e cronograma.",
  },
  {
    q: "O que está incluído no bônus de Mapas de TI?",
    a: "Você recebe mapas visuais em PDF e imagens de alta resolução, com conteúdos de Dados, Inteligência, Gestão, Segurança, Banco de Dados, Governança, Redes e Cloud, além de atualizações durante um ano.",
  },
  {
    q: "A assinatura tem garantia?",
    a: "Sim. Você tem sete dias de garantia para avaliar o ClickEdital e solicitar o reembolso conforme a política da assinatura.",
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
