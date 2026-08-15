import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["Edital", "Cargo", "Disciplinas", "Revisão"];

export function AtivacaoStepper({ current }: { current: number }) {
  return <ol className="grid grid-cols-4 gap-1" aria-label="Etapas da ativação">{STEPS.map((label, index) => { const number = index + 1; const done = number < current; const active = number === current; return <li key={label} aria-current={active ? "step" : undefined} className="min-w-0"><div className={cn("h-1 rounded-full", number <= current ? "bg-primary" : "bg-muted")} /><div className={cn("mt-2 flex items-center gap-1.5 text-xs", active ? "font-semibold text-primary" : "text-muted-foreground")}><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", number <= current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span><span className="hidden truncate sm:inline">{label}</span></div></li>; })}</ol>;
}
