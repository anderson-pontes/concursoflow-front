import { Layers, TrendingUp } from "lucide-react";

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-neutral-100">
          Flashcards
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground dark:text-neutral-400">
          Revise com repetição espaçada e fixe o conteúdo dos editais.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
        >
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground dark:text-neutral-400">Cartões</span>
          <span className="tabular-nums text-base font-semibold text-foreground dark:text-neutral-100">
            {totalCardsGlobal}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
        >
          <span className="text-lg leading-none" aria-hidden>🔥</span>
          <span className="text-muted-foreground dark:text-neutral-400">Sequência</span>
          <span className="tabular-nums text-base font-semibold text-foreground dark:text-neutral-100">
            {globalStreak} {globalStreak === 1 ? "dia" : "dias"}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-warning/30 bg-card px-3 py-2 text-sm shadow-sm"
        >
          <span className="text-muted-foreground dark:text-neutral-400">Revisar hoje</span>
          <span
            className={[
              "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full px-2 tabular-nums text-sm font-semibold text-white",
              dueTodayTotal > 0 ? "fc-badge-pulse bg-orange-600" : "bg-muted-foreground",
            ].join(" ")}
          >
            {dueTodayTotal}
          </span>
        </div>
        {showDeckMetrics ? (
          <div
            className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-card px-3 py-2 text-sm shadow-sm"
          >
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-muted-foreground dark:text-neutral-400">Domínio médio</span>
            <span className="tabular-nums text-base font-semibold text-success">{avgDominio}%</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
