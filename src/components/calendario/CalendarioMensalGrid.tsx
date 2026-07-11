import React from "react";

import type { CalendarioDia } from "@/lib/calendario/types";
import { DIAS_SEMANA_PT } from "@/lib/calendario/constants";
import { CalendarioDiaCell } from "./CalendarioDiaCell";

type Props = {
  ano: number;
  mes: number;
  dias: CalendarioDia[];
  onDiaClick?: (data: string) => void;
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

export function CalendarioMensalGrid({ ano, mes, dias, onDiaClick }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const cells = React.useMemo(() => buildGridCells(ano, mes, dias), [ano, mes, dias]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
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
            <div key={cell.key} className="min-h-[88px] sm:min-h-[104px]" aria-hidden />
          ),
        )}
      </div>
      </div>
    </div>
  );
}
