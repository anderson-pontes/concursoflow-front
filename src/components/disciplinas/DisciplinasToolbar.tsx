import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import type { FilterSeg } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

export type DisciplinasSummary = {
  n: number;
  emProg: number;
  noConcurso: number;
  fora: number;
  media: number;
};

type DisciplinasToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filterSeg: FilterSeg;
  onFilterChange: (seg: FilterSeg) => void;
  onCreate: () => void;
  summary: DisciplinasSummary;
  concursoId: string;
  isCreating: boolean;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
};

export function DisciplinasToolbar({
  search,
  onSearchChange,
  filterSeg,
  onFilterChange,
  onCreate,
  summary,
  concursoId,
  isCreating,
  viewMode,
  onViewModeChange,
}: DisciplinasToolbarProps) {
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);
  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () =>
      (await api.get("/concursos")).data as Array<{ id: string; nome: string; orgao: string; cargo: string | null }>,
  });

  const metaParts = [
    `${summary.n} ${summary.n === 1 ? "disciplina" : "disciplinas"}`,
    `${summary.emProg} em progresso`,
    `média ${summary.media}%`,
  ];
  if (concursoId) {
    metaParts.push(`${summary.noConcurso} no concurso`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Disciplinas & Tópicos
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo do plano · progresso no concurso ativo
          </p>
        </div>
        <button
          type="button"
          disabled={isCreating}
          onClick={onCreate}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Nova disciplina
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar disciplina..."
              aria-label="Buscar disciplina"
              className="min-h-10 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {concursos.length > 0 ? (
            <select
              aria-label="Concurso ativo"
              className="min-h-10 min-w-[12rem] rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={concursoId}
              onChange={(e) => setConcursoAtivoId(e.target.value || null)}
            >
              <option value="">Concurso ativo…</option>
              {concursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.orgao} — {c.cargo ?? c.nome}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {concursoId ? (
            <div
              className="inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5"
              role="group"
              aria-label="Filtrar por vínculo ao concurso"
            >
              {(
                [
                  { id: "todas" as const, label: "Todas" },
                  { id: "concurso" as const, label: "No concurso" },
                  { id: "fora" as const, label: "Fora" },
                ] as const
              ).map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  aria-pressed={filterSeg === seg.id}
                  onClick={() => onFilterChange(seg.id)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-md px-3 text-sm font-medium transition-colors",
                    filterSeg === seg.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="sr-only">Sem concurso ativo — filtros de vínculo ocultos</span>
          )}

          <div
            className="ml-auto inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              aria-label="Vista em cards"
              aria-pressed={viewMode === "cards"}
              onClick={() => onViewModeChange("cards")}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Vista em tabela"
              aria-pressed={viewMode === "table"}
              onClick={() => onViewModeChange("table")}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">{metaParts.join(" · ")}</p>

      {!concursoId && concursos.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Cadastre um concurso em <strong>Meus Concursos</strong> para vincular disciplinas e definir a data da prova.
        </div>
      ) : null}
    </div>
  );
}
