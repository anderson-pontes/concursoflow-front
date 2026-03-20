type HeatmapData = {
  date: string;
  count: number;
};

function getCellColor(minutes: number) {
  if (minutes <= 0) return "bg-neutral-100 dark:bg-neutral-700";
  if (minutes <= 30) return "bg-primary-100";
  if (minutes <= 120) return "bg-primary-200";
  if (minutes <= 240) return "bg-primary-600";
  return "bg-primary-800";
}

export function HeatmapCard({ data }: { data: HeatmapData[] }) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const last112 = sorted.slice(-112);
  const cells = Array.from({ length: 112 }, (_, i) => last112[i] ?? { date: `empty-${i}`, count: 0 });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-100">Heatmap de estudos</h3>
      <p className="mb-4 text-xs text-neutral-400">Últimas 16 semanas</p>

      <div className="flex gap-[3px] overflow-x-auto">
        {Array.from({ length: 16 }, (_, col) => (
          <div key={col} className="grid grid-rows-7 gap-[3px]">
            {Array.from({ length: 7 }, (_, row) => {
              const idx = col * 7 + row;
              const cell = cells[idx];
              return (
                <div
                  key={`${cell.date}-${idx}`}
                  className={`h-[11px] w-[11px] rounded-[3px] ${getCellColor(cell.count)}`}
                  title={`${cell.date}: ${cell.count} min`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-400">
        <span>menos</span>
        <span className="h-[11px] w-[11px] rounded-[3px] bg-neutral-100 dark:bg-neutral-700" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-100" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-200" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-600" />
        <span>mais</span>
      </div>
    </div>
  );
}

