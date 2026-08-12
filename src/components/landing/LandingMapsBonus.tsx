import {
  BrainCircuit,
  Check,
  Cloud,
  Database,
  FileImage,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    icon: BrainCircuit,
    title: "Dados e Inteligência",
    topics: "Fluência em Dados, Big Data, BI, Data Warehouse, Data Lake e Machine Learning",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: Workflow,
    title: "Gestão e Metodologias",
    topics: "Metodologias Ágeis, Kanban, Scrum, PMBOK, ITIL 4 e COBIT 2019",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    topics: "Criptografia, VPN, Firewall, IDS/IPS, LGPD e ISO 27001",
    color: "bg-rose-100 text-rose-700",
  },
  {
    icon: Database,
    title: "Banco de Dados",
    topics: "SQL, NoSQL, fundamentos, transações e propriedades ACID",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Cloud,
    title: "Redes e Cloud",
    topics: "Modelos TCP/IP e OSI, Cloud Computing e virtualização",
    color: "bg-sky-100 text-sky-700",
  },
] as const;

const highlights = [
  { icon: FileImage, title: "Material visual", body: "PDF e imagens em alta resolução" },
  { icon: RefreshCw, title: "Atualizações por 1 ano", body: "Material atualizado durante o período" },
] as const;

export function LandingMapsBonus() {
  return (
    <section
      id="bonus-mapas"
      className="relative scroll-mt-20 overflow-hidden bg-slate-950 py-16 text-white md:py-24"
      aria-labelledby="bonus-mapas-heading"
    >
      <div className="landing-map-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3.5 py-2 text-xs font-bold text-violet-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Bônus exclusivo da assinatura anual
            </p>
            <h2
              id="bonus-mapas-heading"
              className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            >
              Assine o ClickEdital e receba os Mapas de TI como bônus
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
              Além de organizar toda a sua preparação no ClickEdital, você recebe mapas visuais para revisar conteúdos de Tecnologia da Informação.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              O ClickEdital é a plataforma principal e funciona para concursos de qualquer área. Os mapas são um bônus especialmente útil para quem também estuda TI.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                  <Icon className="h-5 w-5 text-violet-300" aria-hidden />
                  <strong className="mt-3 block text-sm text-white">{title}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-400">{body}</span>
                </div>
              ))}
            </div>

            <Link
              to="/register"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-950 outline-none transition hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <Check className="h-4 w-4 text-primary" aria-hidden /> Quero organizar meus estudos
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-[2rem] bg-violet-500/20 blur-3xl" aria-hidden />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Mapas de TI da Déia</p>
                  <h3 className="mt-1 text-xl font-bold">O que você leva no bônus</h3>
                </div>
                <span className="landing-map-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200">
                  <BrainCircuit className="h-6 w-6" aria-hidden />
                </span>
              </div>

              <ul className="mt-5 grid list-none gap-3 sm:grid-cols-2">
                {modules.map(({ icon: Icon, title, topics, color }, index) => (
                  <li
                    key={title}
                    className={`rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-violet-300/35 ${index === modules.length - 1 ? "sm:col-span-2" : ""}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h4 className="mt-3 text-sm font-bold text-white">{title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{topics}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-5 flex items-start gap-2 rounded-xl bg-violet-400/10 px-4 py-3 text-xs leading-relaxed text-violet-100">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Conteúdo digital voltado a disciplinas de TI cobradas em concursos, incluído sem custo adicional no plano anual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
