import { BarChart3, BellRing, CalendarDays, Check, ClipboardList, Clock3, Timer } from "lucide-react";

import dashboardSrc from "@/assets/dashboard.png";
import { LandingShot } from "@/components/landing/LandingShot";

const features = [
  {
    icon: ClipboardList,
    title: "Edital verticalizado",
    body: "Divida o edital em disciplinas e tópicos para visualizar exatamente o que já estudou e o que ainda falta.",
  },
  {
    icon: CalendarDays,
    title: "Cronograma de estudos",
    body: "Organize os conteúdos ao longo da semana e mantenha uma rotina alinhada às suas prioridades.",
  },
  {
    icon: Timer,
    title: "Sessões de foco",
    body: "Use o temporizador Pomodoro para estudar com mais concentração e registrar o tempo dedicado a cada disciplina.",
  },
  {
    icon: Clock3,
    title: "Registro de estudos",
    body: "Registre horas, tópicos, revisões e questões para construir um histórico completo da sua preparação.",
  },
  {
    icon: BarChart3,
    title: "Indicadores de desempenho",
    body: "Acompanhe seus acertos por disciplina e identifique onde você está evoluindo e onde precisa reforçar os estudos.",
  },
  {
    icon: BellRing,
    title: "Revisões e avisos",
    body: "Tenha uma visão clara das próximas revisões e dos conteúdos que precisam voltar para sua rotina.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="recursos"
      className="scroll-mt-20 bg-background py-16 md:py-24"
      aria-labelledby="recursos-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">O que o sistema entrega</p>
          <h2
            id="recursos-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Recursos que ajudam você a transformar planejamento em progresso visível
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cada recurso conecta o conteúdo do edital à sua rotina e aos resultados que você registra.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <strong className="block text-sm text-foreground">{title}</strong>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="lg:sticky lg:top-24">
            <LandingShot
              src={dashboardSrc}
              alt="Dashboard ClickEdital com métricas, heatmap e plano do dia"
              className="aspect-[16/10]"
              position="object-center"
            />
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden /> Dados da sua rotina reunidos em um único painel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
