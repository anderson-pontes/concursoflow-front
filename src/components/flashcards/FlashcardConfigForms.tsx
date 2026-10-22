import React from "react";
import { ChevronRight, Info, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FlashCfgAccordion({ title, open, onToggle, children, columns = false, icon: Icon }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode; columns?: boolean; icon?: LucideIcon;
}) {
  const id = React.useId();
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <Button type="button" variant="ghost" aria-expanded={open} aria-controls={id} onClick={onToggle}
        className="flash-config-heading min-h-12 w-full justify-between rounded-none px-4 text-left text-sm font-semibold">
        <span className="flex min-w-0 items-center gap-2">{Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden />}{title}</span>
        <ChevronRight className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`} aria-hidden />
      </Button>
      {open && <div id={id} className={`flash-config-fields border-t border-border p-4 ${columns ? "flash-config-columns" : ""}`}>{children}</div>}
    </section>
  );
}

type RowProps = { label: string; tooltip: string; value: number; onChange: (v: number) => void; min: number; max: number; dirty: boolean; error?: string };
type DefaultProps = { defaultVal?: number; onChipReset?: () => void };
const format = (n: number) => Number.isFinite(n) ? String(n).replace(".", ",") : "";
function parseEntry(text: string) {
  const normalized = text.trim().replace(",", ".");
  return /^\d+(?:\.\d*)?$/.test(normalized) ? Number(normalized) : NaN;
}

function ConfigRow({ label, tooltip, value, onChange, min, max, dirty, error, step = 1, decimals = 0, sliderMax = max, defaultVal, onChipReset }: RowProps & DefaultProps & { step?: number; decimals?: number; sliderMax?: number }) {
  const id = React.useId();
  const [entry, setEntry] = React.useState(() => format(value));
  React.useEffect(() => {
    setEntry(previous => Object.is(parseEntry(previous), value) ? previous : format(value));
  }, [value]);
  const sliderValue = Number.isFinite(value) ? Math.min(sliderMax, Math.max(min, value)) : min;
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="min-w-0 text-sm font-semibold leading-snug text-foreground">{label}</label>
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" aria-label={`Sobre ${label}`}><Info className="size-4" aria-hidden /></Button>
        </TooltipTrigger><TooltipContent className="max-w-[min(22rem,calc(100vw-32px))] whitespace-normal">{tooltip}</TooltipContent></Tooltip></TooltipProvider>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_5rem] items-center gap-3">
        <input type="range" aria-label={`${label} (controle deslizante)`} min={min} max={sliderMax} step={step} value={sliderValue}
          onChange={e => onChange(Number(e.target.value))} className="flash-range focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Input id={id} type={decimals ? "text" : "number"} inputMode={decimals ? "decimal" : "numeric"}
          aria-invalid={Boolean(error)} aria-describedby={`${id}-limits${error ? ` ${id}-error` : ""}`}
          min={decimals ? undefined : min} max={decimals ? undefined : max} step={decimals ? undefined : step}
          value={decimals ? entry : Number.isFinite(value) ? value : ""}
          onChange={e => {
            const raw = e.target.value;
            setEntry(raw);
            const parsed = parseEntry(raw);
            onChange(decimals || !Number.isFinite(parsed) ? parsed : Math.min(max, Math.max(min, Math.round(parsed))));
          }}
          onBlur={() => { if (Number.isFinite(value)) setEntry(format(value)); }}
          className={`min-h-11 min-w-0 tabular-nums ${error ? "border-destructive" : dirty ? "border-primary" : ""}`} />
      </div>
      <div id={`${id}-limits`} className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>{sliderMax < max ? `Slider: ${format(min)} a ${format(sliderMax)} · Campo numérico: até ${format(max)}` : `Mín. ${format(min)} · Máx. ${format(max)}`}</p>
      </div>
      {defaultVal != null && <Button variant="ghost" size="sm" type="button" onClick={onChipReset}
        className="min-h-9 max-w-full rounded-full bg-primary/5 px-3 text-xs text-primary hover:bg-primary/10">Padrão Anki: {format(defaultVal)}</Button>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
export function FlashCfgIntRow(props: RowProps & { sliderMax?: number; defaultVal: number; onChipReset: () => void }) { return <ConfigRow {...props} />; }
export function FlashCfgFloatRow(props: RowProps & DefaultProps & { step: number; decimals: number }) { return <ConfigRow {...props} />; }
