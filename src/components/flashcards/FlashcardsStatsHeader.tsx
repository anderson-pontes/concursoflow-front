import { Layers, TrendingUp } from "lucide-react";

import { FLASH_DUE_BADGE, FLASH_MUTED } from "@/lib/flashcards/constants";

type Props = {
  totalCardsGlobal: number;
  globalStreak: number;
  dueTodayTotal: number;
  avgDominio: number;
  showDeckMetrics: boolean;
};

export function FlashcardsStatsHeader({
  totalCardsGlobal,
  globalStreak,
  dueTodayTotal,
  avgDominio,
  showDeckMetrics,
}: Props) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-neutral-100">
          Flashcards
        </h1>
        <p className="mt-0.5 text-sm text-[#6B7280] dark:text-neutral-400">
          Revise com repetição espaçada e fixe o conteúdo dos editais.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <Layers className="h-4 w-4 text-[#6C3FC5]" />
          <span className="text-[#6B7280] dark:text-neutral-400">Cartões</span>
          <span className="tabular-nums text-base font-semibold text-[#1A1A2E] dark:text-neutral-100">
            {totalCardsGlobal}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <span className="text-lg leading-none" aria-hidden>🔥</span>
          <span className="text-[#6B7280] dark:text-neutral-400">Sequência</span>
          <span className="tabular-nums text-base font-semibold text-[#1A1A2E] dark:text-neutral-100">
            {globalStreak} {globalStreak === 1 ? "dia" : "dias"}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm dark:border-orange-900/50 dark:bg-neutral-800"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <span className="text-[#6B7280] dark:text-neutral-400">Revisar hoje</span>
          <span
            className={[
              "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full px-2 tabular-nums text-sm font-semibold text-white",
              dueTodayTotal > 0 ? "fc-badge-pulse" : "",
            ].join(" ")}
            style={{ backgroundColor: dueTodayTotal > 0 ? FLASH_DUE_BADGE : FLASH_MUTED }}
          >
            {dueTodayTotal}
          </span>
        </div>
        {showDeckMetrics ? (
          <div
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-neutral-800"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <TrendingUp className="h-4 w-4 text-[#22C55E]" />
            <span className="text-[#6B7280] dark:text-neutral-400">Domínio médio</span>
            <span className="tabular-nums text-base font-semibold text-[#22C55E]">{avgDominio}%</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
