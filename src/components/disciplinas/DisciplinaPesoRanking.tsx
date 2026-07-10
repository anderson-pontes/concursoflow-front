import React from "react";
import { Scale, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Disciplina } from "@/lib/disciplinas/types";
import {
  buildDisciplinaRanking,
  fmtPontos,
  type DisciplinaRankingRow,
} from "@/lib/disciplinas/pontos";

type DisciplinaPesoRankingProps = {
  disciplinas: Disciplina[];
  concursoId: string;
  filterSeg: "todas" | "concurso" | "fora";
};

const BAR_COLORS = [
  "bg-[#6C3FC5]",
  "bg-[#22C55E]",
  "bg-[#3B82F6]",
  "bg-[#F59E0B]",
  "bg-[#EC4899]",
  "bg-[#14B8A6]",
] as const;

function barColor(rank: number) {
  return BAR_COLORS[(rank - 1) % BAR_COLORS.length];
}

function RankingRow({ row, maxPct }: { row: DisciplinaRankingRow; maxPct: number }) {
  const widthPct = maxPct > 0 ? Math.max(4, (row.pct / maxPct) * 100) : 0;
  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white",
              barColor(row.rank),
            )}
          >
            {row.rank}
          </span>
          <span className="truncate font-semibold text-[var(--text-primary)]">{row.nome}</span>
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <span className="font-bold text-[var(--text-primary)]">{fmtPontos(row.total_pontos)} pts</span>
          <span className="ml-2 text-[var(--text-muted)]">({row.pct}%)</span>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-8">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E1A2E]">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", barColor(row.rank))}
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </div>
    </li>
  );
}

export function DisciplinaPesoRanking({ disciplinas, concursoId, filterSeg }: DisciplinaPesoRankingProps) {
  const ranking = React.useMemo(() => {
    return buildDisciplinaRanking(disciplinas, (d) => {
      if (!concursoId) return true;
      const linked = d.concurso_ids.includes(concursoId);
      if (filterSeg === "concurso") return linked;
      if (filterSeg === "fora") return !linked;
      return linked;
    });
  }, [disciplinas, concursoId, filterSeg]);

  const totalPontos = ranking.reduce((acc, r) => acc + r.total_pontos, 0);
  const maxPct = ranking[0]?.pct ?? 0;

  if (ranking.length === 0) {
    return (
      <section
        className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-8 text-center shadow-sm"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <Scale className="mx-auto h-8 w-8 text-[var(--text-muted)]" aria-hidden />
        <h2 className="mt-3 text-base font-bold text-[var(--text-primary)]">Ranking por peso no edital</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          Cadastre os assuntos (tópicos) de cada disciplina e defina o peso de cada um para ver a relevância na
          prova.
          {concursoId ? " Mostramos disciplinas vinculadas ao concurso ativo." : " Selecione um concurso para filtrar."}
        </p>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#6C3FC5] dark:bg-[var(--ap-brand-light)]">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Peso das disciplinas na prova</h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Peso = soma do peso dos assuntos · soma do edital:{" "}
              <strong className="text-[var(--text-primary)]">{fmtPontos(totalPontos)} pts</strong>
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-[#F3F0FF] px-3 py-2 text-center dark:bg-[#1E1A2E]">
          <div className="text-lg font-bold tabular-nums text-[#6C3FC5] dark:text-[#A78BFA]">{ranking.length}</div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">disciplinas</div>
        </div>
      </header>

      <ol className="space-y-4 px-5 py-5">
        {ranking.map((row) => (
          <RankingRow key={row.id} row={row} maxPct={maxPct} />
        ))}
      </ol>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]/40 px-5 py-3 text-xs text-[var(--text-muted)]">
        Quanto maior o percentual, mais pontos a disciplina vale na prova — priorize na sua preparação.
      </footer>
    </section>
  );
}
