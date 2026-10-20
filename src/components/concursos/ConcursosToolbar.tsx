import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Plus, Search, Sparkles, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "@/components/concursos/concursos.css";
import { MetricCard } from "@/components/ui/metric-card";
import type { ConcursoStatusFilter } from "@/lib/concursos/types";
import { cn } from "@/lib/utils";
import { ConcursosEmptyIllustration } from "@/components/concursos/ConcursosEmptyIllustration";

type Actions = { onCreate: () => void; onChooseCatalog: () => void };
type Props = {
  search: string;
  statusFilter: ConcursoStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ConcursoStatusFilter) => void;
};
const SEGMENTS: { id: ConcursoStatusFilter; label: string }[] = [
  { id: "todos", label: "Todos" }, { id: "ativos", label: "Ativos" }, { id: "encerrados", label: "Encerrados" },
];

export function ConcursosHeader({ onCreate, onChooseCatalog }: Actions) {
  return <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold leading-tight text-foreground">Meus Concursos</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Gerencie seus concursos e acompanhe sua preparação em um só lugar.</p>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
      <Button variant="outline" onClick={onCreate}><Plus />Cadastro manual</Button>
      <Button onClick={onChooseCatalog}><Sparkles />Criar plano guiado</Button>
    </div>
  </header>;
}

export function ConcursosToolbar({ search, statusFilter, onSearchChange, onStatusFilterChange }: Props) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input type="search" value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Buscar concurso..." aria-label="Buscar concurso" className="h-11 pl-10" />
    </div>
    <div role="group" aria-label="Filtrar concursos por situação" className="inline-flex shrink-0 rounded-lg bg-muted p-1">
      {SEGMENTS.map(seg => <button key={seg.id} type="button" aria-pressed={statusFilter === seg.id} onClick={() => onStatusFilterChange(seg.id)} className={cn("min-h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", statusFilter === seg.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card hover:text-foreground")}>{seg.label}</button>)}
    </div>
  </div>;
}

export function ConcursosSummaryBar({ totalCadastrados, totalAtivos, proximaProva, loading, unavailable }: { totalCadastrados: number; totalAtivos: number; proximaProva: Date | null; loading?: boolean; unavailable?: boolean }) {
  const value = (content: string | number) => loading ? <span className="block h-8 w-16 animate-pulse rounded bg-muted" aria-label="Carregando" /> : unavailable ? "—" : content;
  return <section aria-label="Resumo dos concursos" aria-busy={loading} className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
    <MetricCard className="concursos-kpi" tone="indigo" icon={Trophy} label="Concursos cadastrados" value={value(totalCadastrados)} description="Todos os seus concursos" />
    <MetricCard className="concursos-kpi" tone="green" icon={Target} label="Concursos ativos" value={value(totalAtivos)} description="Concursos não encerrados" />
    <MetricCard className="concursos-kpi col-span-2 lg:col-span-1" tone="orange" icon={CalendarDays} label="Próxima prova" value={value(proximaProva ? format(proximaProva, "dd MMM yyyy", { locale: ptBR }) : "Não definida")} description="Próxima data conhecida" />
  </section>;
}

export function ConcursosEmptyState({ onCreate, onChooseCatalog }: Actions) {
  return <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-4 py-10 text-center sm:px-8 sm:py-12">
    <ConcursosEmptyIllustration />
    <h2 className="mt-5 text-lg font-semibold text-foreground">Nenhum concurso cadastrado ainda</h2>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">Adicione seu primeiro concurso e comece a estudar com foco.</p>
    <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button onClick={onChooseCatalog}>Criar plano guiado</Button>
      <Button variant="outline" onClick={onCreate}>Cadastrar manualmente</Button>
    </div>
  </div>;
}
