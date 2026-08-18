type HeatmapData = {
  date: string;
  count: number;
  minutes?: number;
};

function getCellColor(minutes: number) {
  if (minutes <= 0) return "bg-muted";
  if (minutes <= 30) return "bg-primary-100";
  if (minutes <= 120) return "bg-primary-200";
  if (minutes <= 240) return "bg-primary-600";
  return "bg-primary-800";
}

export function HeatmapCard({ data }: { data: HeatmapData[] }) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const last112 = sorted.slice(-112);
  const cells = Array.from({ length: 112 }, (_, i) => last112[i] ?? { date: `empty-${i}`, count: 0, minutes: 0 });
  const activeDays = last112.filter((cell) => (cell.minutes ?? cell.count) > 0).length;
  const totalMinutes = last112.reduce((sum, cell) => sum + (cell.minutes ?? cell.count), 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <h3 className="text-sm font-medium text-foreground">Heatmap de estudos</h3>
      <p className="mb-4 text-xs text-muted-foreground">Últimas 16 semanas</p>

      <div
        className="flex gap-[3px] overflow-x-auto"
        role="img"
        aria-label={`${activeDays} dias com estudo e ${totalMinutes} minutos acumulados nas últimas 16 semanas`}
      >
        {Array.from({ length: 16 }, (_, col) => (
          <div key={col} className="grid grid-rows-7 gap-[3px]">
            {Array.from({ length: 7 }, (_, row) => {
              const idx = col * 7 + row;
              const cell = cells[idx];
              const mins = cell.minutes ?? cell.count;
              return (
                <div
                  key={`${cell.date}-${idx}`}
                  className={`h-[11px] w-[11px] rounded-[3px] ${getCellColor(mins)}`}
                  title={`${cell.date}: ${mins} min`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground" aria-hidden="true">
        <span>menos</span>
        <span className="h-[11px] w-[11px] rounded-[3px] bg-muted" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-100" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-200" />
        <span className="h-[11px] w-[11px] rounded-[3px] bg-primary-600" />
        <span>mais</span>
      </div>
    </div>
  );
}

