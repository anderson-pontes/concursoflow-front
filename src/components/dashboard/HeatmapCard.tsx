import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateBR, hojeISO } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

export type HeatmapData = { date: string; count: number; minutes?: number };
function localISO(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function minutesLabel(minutes: number) { const total = Math.round(minutes); return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}min` : ""}`; }
function getCellColor(minutes: number) {
  if (minutes <= 0) return "bg-muted";
  if (minutes <= 30) return "bg-primary-100";
  if (minutes <= 120) return "bg-primary-200";
  if (minutes <= 240) return "bg-primary-600";
  return "bg-primary-800";
}

/** Datas reais, intensidade somente por minutos; count nunca representa duração. */
export function HeatmapCard({ className, data, scopeLabel = "Todos os concursos", endDate = hojeISO(), isLoading = false, isError = false, onRetry }: { className?: string; data: HeatmapData[]; scopeLabel?: string; endDate?: string; isLoading?: boolean; isError?: boolean; onRetry?: () => void }) {
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - 111);
  const byDate = new Map(data.map(row => [row.date, row]));
  const cells = Array.from({ length: 112 }, (_, index) => {
    const date = new Date(start); date.setDate(date.getDate() + index);
    const iso = localISO(date);
    const row = byDate.get(iso);
    const future = iso > endDate;
    const minutes = future ? null : row && !Number.isFinite(row.minutes) ? null : Math.max(0, row?.minutes ?? 0);
    return { iso, date, row, minutes, future };
  });
  const activeDays = cells.filter(cell => !cell.future && ((cell.minutes ?? 0) > 0 || (cell.row?.count ?? 0) > 0)).length;
  const totalMinutes = cells.reduce((sum, cell) => sum + (cell.minutes ?? 0), 0);
  const unavailable = cells.filter(cell => !cell.future && cell.row && cell.minutes === null).length;
  const references = cells.filter((cell, index) => index % 7 === 0 && (index === 0 || cell.date.getMonth() !== cells[index - 7].date.getMonth()));
  return <section className={cn("min-w-0 self-start rounded-xl border border-border bg-card p-4 shadow-sm",className)} aria-labelledby="study-heatmap-title">
    <header className="mb-4 xl:min-h-14"><h2 id="study-heatmap-title" className="flex items-center gap-2 text-base font-medium"><Flame className="size-4 text-warning" aria-hidden="true" />Constância de estudos</h2>
    <p className="mt-1 text-xs text-muted-foreground">{scopeLabel} · últimas 16 semanas · não acompanha o filtro de período</p></header>
    {isLoading ? <Skeleton className="mt-4 h-36 w-full" aria-label="Carregando constância" /> : isError ? <div role="alert" className="mt-4 space-y-2 text-sm"><p>Não foi possível carregar a constância.</p>{onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>}</div> : <>
      <div className="flex min-h-0 flex-1 flex-col justify-center"><div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-muted-foreground" aria-label="Referências de meses">{references.map(cell => <span key={cell.iso}>{cell.date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")} {cell.date.getFullYear()}</span>)}</div>
      <div className="mt-2 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1" role="img" aria-label={`${activeDays} dias com estudo e ${Math.round(totalMinutes)} minutos registrados nas últimas 16 semanas${unavailable ? `; tempo indisponível em ${unavailable} dias` : ""}`}>
        {Array.from({ length: 16 }, (_, column) => <div key={column} className="grid grid-rows-7 gap-1">{Array.from({ length: 7 }, (_, row) => {
          const cell = cells[column * 7 + row];
          const title = `${fmtDateBR(cell.iso)}: ${cell.future ? "Dia futuro" : cell.minutes === null ? "Tempo indisponível" : minutesLabel(cell.minutes)}`;
          return <span key={cell.iso} className={cn("block aspect-square max-h-5 min-h-2 rounded-sm", cell.future ? "bg-muted/30" : cell.minutes === null ? "border border-dashed border-muted-foreground/50 bg-muted" : getCellColor(cell.minutes))} title={title} aria-hidden="true" />;
        })}</div>)}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{fmtDateBR(localISO(start))}</span><span>{fmtDateBR(endDate)}</span></div>
      </div><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><p className="text-xs text-muted-foreground">{activeDays} dias com estudo · {minutesLabel(totalMinutes)} registrados</p><div className="flex items-center gap-1 text-[10px] text-muted-foreground" aria-hidden="true"><span>menos</span>{["bg-muted", "bg-primary-100", "bg-primary-200", "bg-primary-600", "bg-primary-800"].map(color => <span key={color} className={cn("size-2.5 rounded-sm", color)} />)}<span>mais</span></div></div>
      {unavailable > 0 && <p className="mt-2 text-xs text-muted-foreground">Tempo indisponível em {unavailable} {unavailable === 1 ? "dia" : "dias"}. A intensidade considera somente durações informadas.</p>}
      {activeDays === 0 && unavailable === 0 && <p className="mt-2 text-xs text-muted-foreground">Nenhum estudo registrado nesta janela. Registre uma sessão para acompanhar sua constância.</p>}
    </>}
  </section>;
}
