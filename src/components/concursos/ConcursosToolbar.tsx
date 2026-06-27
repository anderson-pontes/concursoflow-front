import type { ConcursoStatusFilter } from "@/lib/concursos/types";
import { CONCURSO_CARD_SHADOW } from "@/lib/concursos/utils";
import { cn } from "@/lib/utils";

import { ConcursosEmptyIllustration } from "./ConcursosEmptyIllustration";

type Props = {
  search: string;
  statusFilter: ConcursoStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ConcursoStatusFilter) => void;
  onCreate: () => void;
};

const SEGMENTS: { id: ConcursoStatusFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "encerrados", label: "Encerrados" },
];

export function ConcursosToolbar({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-tight text-[var(--text-primary)]">Concursos</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Gerencie seus concursos-alvo e acompanhe seu progresso
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-[240px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base opacity-60" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar concurso..."
            className="h-11 w-full rounded-[10px] border-[1.5px] border-[var(--border-default)] bg-white py-2 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE] dark:bg-[var(--bg-surface)] dark:focus:shadow-[0_0_0_3px_rgba(167,139,250,0.2)]"
          />
        </div>

        <div className="inline-flex rounded-[10px] bg-[#F3F4F6] p-1 dark:bg-[var(--bg-surface-2)]">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => onStatusFilterChange(seg.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                statusFilter === seg.id
                  ? "bg-[#6C3FC5] text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                  : "bg-transparent text-[#6B7280] dark:text-[var(--text-secondary)]",
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8]"
        >
          <span className="text-lg leading-none">+</span>
          Novo concurso
        </button>
      </div>
    </div>
  );
}

export function ConcursosSummaryBar({
  totalCadastrados,
  totalAtivos,
}: {
  totalCadastrados: number;
  totalAtivos: number;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
        📋 {totalCadastrados} {totalCadastrados === 1 ? "concurso cadastrado" : "concursos cadastrados"}
      </span>
      <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
        ✅ {totalAtivos} {totalAtivos === 1 ? "ativo" : "ativos"}
      </span>
      <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-sm">
        📅 Próxima prova: não definida
      </span>
    </div>
  );
}

export function ConcursosEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-8 py-16 text-center"
      style={{ boxShadow: CONCURSO_CARD_SHADOW }}
    >
      <ConcursosEmptyIllustration />
      <h2 className="mt-6 text-lg font-bold text-[var(--text-primary)]">Nenhum concurso cadastrado ainda</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        Adicione seu primeiro concurso-alvo e comece a estudar com foco.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8]"
      >
        + Cadastrar meu primeiro concurso
      </button>
    </div>
  );
}
