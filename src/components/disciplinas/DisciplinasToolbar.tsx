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
  filterSeg: FilterSeg;
  onFilterChange: (seg: FilterSeg) => void;
  onCreate: () => void;
  summary: DisciplinasSummary;
  concursoId: string;
  isCreating: boolean;
};

export function DisciplinasToolbar({
  filterSeg,
  onFilterChange,
  onCreate,
  summary,
  concursoId,
  isCreating,
}: DisciplinasToolbarProps) {
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);
  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () =>
      (await api.get("/concursos")).data as Array<{ id: string; nome: string; orgao: string; cargo: string | null }>,
  });

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[var(--text-primary)]">Disciplinas & Tópicos</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Catálogo global vinculado aos seus concursos (plano de estudo)
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {concursos.length > 0 ? (
            <select
              className="h-10 min-w-[200px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#6C3FC5]"
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
          {concursoId ? (
            <div className="inline-flex rounded-full bg-[#F3F4F6] p-1 dark:bg-[var(--bg-surface-2)]">
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
                  onClick={() => onFilterChange(seg.id)}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-all",
                    filterSeg === seg.id
                      ? "bg-[#6C3FC5] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            disabled={isCreating}
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-[#5B32A8] disabled:opacity-50"
          >
            + Nova disciplina
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)]">
          📚 {summary.n} {summary.n === 1 ? "disciplina" : "disciplinas"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)]">
          ✅ {summary.emProg} em progresso
        </span>
        {concursoId ? (
          <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)]">
            🏛 {summary.noConcurso} no concurso · {summary.fora} fora
          </span>
        ) : null}
        <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--text-secondary)]">
          📈 {summary.media}% progresso médio
        </span>
      </div>

      {!concursoId && concursos.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Cadastre um concurso em <strong>Meus Concursos</strong> para vincular disciplinas e definir a data da prova.
        </div>
      ) : null}
    </>
  );
}
