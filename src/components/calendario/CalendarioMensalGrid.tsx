import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { CalendarioDia } from "@/lib/calendario/types";
import { DIAS_SEMANA_PT } from "@/lib/calendario/constants";
import { CalendarioDiaCell } from "./CalendarioDiaCell";

type Props = {
  ano: number;
  mes: number;
  dias: CalendarioDia[];
  onDiaClick?: (data: string) => void;
  detailed?: boolean;
};

function buildGridCells(ano: number, mes: number, dias: CalendarioDia[]) {
  const map = new Map(dias.map((d) => [d.data, d]));
  const first = new Date(ano, mes - 1, 1);
  const lastDay = new Date(ano, mes, 0).getDate();
  const startPad = first.getDay();

  const cells: Array<{ key: string; diaNumero: number; isCurrentMonth: boolean; data: string | null }> = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ key: `pad-${i}`, diaNumero: 0, isCurrentMonth: false, data: null });
  }
  for (let d = 1; d <= lastDay; d++) {
    const data = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ key: data, diaNumero: d, isCurrentMonth: true, data });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, diaNumero: 0, isCurrentMonth: false, data: null });
  }

  return cells.map((c) => ({
    ...c,
    dia: c.data ? map.get(c.data) ?? null : null,
  }));
}

export function CalendarioMensalGrid({ ano, mes, dias, onDiaClick, detailed=false }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const cells = React.useMemo(() => buildGridCells(ano, mes, dias), [ano, mes, dias]);
  const [showEmpty,setShowEmpty]=React.useState(false);
  if(detailed) {
    const localToday=format(new Date(),"yyyy-MM-dd");
    const days=cells.filter(cell=>cell.isCurrentMonth&&cell.data);
    const agendaDays=days.filter(cell=>showEmpty||cell.data===localToday||(cell.dia?.minutos_planejados??0)>0||(cell.dia?.minutos_realizados??0)>0||(cell.dia?.planejado.length??0)>0);
    const renderDay=(cell:typeof cells[number],agenda=false)=><CalendarioDiaCell key={cell.key} detailed agenda={agenda} dia={cell.dia} data={cell.data!} diaNumero={cell.diaNumero} isCurrentMonth isToday={cell.data===localToday} onClick={onDiaClick?()=>onDiaClick(cell.data!):undefined}/>;
    return <TooltipProvider><div className="calendar-study-view">
      <section className="calendar-study-month" aria-label="Calendário mensal de estudos">
        <div className="mb-2 grid grid-cols-7 gap-2">{DIAS_SEMANA_PT.map(label=><span key={label} className="py-1 text-center text-xs font-medium text-muted-foreground">{label}</span>)}</div>
        <div className="grid grid-cols-7 gap-2">{cells.map(cell=>cell.isCurrentMonth?renderDay(cell):<div key={cell.key} aria-hidden/>)}</div>
      </section>
      <section className="calendar-study-agenda" aria-label="Agenda de estudos do mês">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Agenda do mês</h2><Button variant="ghost" size="sm" aria-pressed={showEmpty} onClick={()=>setShowEmpty(value=>!value)}>{showEmpty?"Ocultar dias vazios":"Mostrar dias vazios"}</Button></div>
        {!agendaDays.length&&<p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Nenhum estudo planejado ou registrado neste mês.</p>}
        {agendaDays.map(cell=>renderDay(cell,true))}
      </section>
    </div></TooltipProvider>;
  }

  return (
    <div
      className="overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="region"
      aria-label="Calendário mensal de estudos"
      tabIndex={0}
    >
      <div className="min-w-[700px]">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {DIAS_SEMANA_PT.map((label) => (
            <div key={label} className="py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) =>
            cell.isCurrentMonth && cell.data ? (
              <CalendarioDiaCell
                key={cell.key}
                dia={cell.dia}
                diaNumero={cell.diaNumero}
                isCurrentMonth
                isToday={cell.data === today}
                onClick={() => onDiaClick?.(cell.data!)}
              />
            ) : (
              <div key={cell.key} className="min-h-[132px] sm:min-h-[160px]" aria-hidden />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
