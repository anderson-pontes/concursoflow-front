import React from "react";
import { Calendar, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { PlanoEstudo } from "@/types/plano";

function calcStats(plano: PlanoEstudo) {
  const fallback = { disciplinas_qty: 0, topicos_estudados: 0, topicos_total: 0, progresso_pct: 0 };
  const stats = (plano as PlanoEstudo & { stats?: typeof fallback }).stats ?? fallback;
  const disciplinas = stats.disciplinas_qty;
  const estudados = stats.topicos_estudados;
  const total = stats.topicos_total;
  const pct = stats.progresso_pct;
  return { disciplinas, estudados, total, pct };
}

export function PlanoCard({
  plano,
  onAtivar,
  onEditar,
  onExcluir,
}: {
  plano: PlanoEstudo;
  onAtivar: (id: string) => void;
  onEditar: (plano: PlanoEstudo) => void;
  onExcluir: (plano: PlanoEstudo) => void;
}) {
  const navigate = useNavigate();
  const stats = calcStats(plano);
  const statusClass =
    plano.status === "ativo"
      ? "bg-success-50 text-success-800"
      : plano.status === "pausado"
        ? "bg-warning-50 text-warning-800"
        : "bg-neutral-100 text-neutral-500";

  return (
    <div
      className={[
        "relative cursor-pointer overflow-hidden rounded-xl border bg-white transition-all hover:border-primary-200 hover:shadow-sm dark:bg-neutral-800 dark:border-neutral-700",
        plano.ativo ? "border-2 border-primary-500" : "border-neutral-200",
      ].join(" ")}
      onClick={() => navigate(`/concursos/planos/${plano.id}`)}
    >
      {plano.ativo ? (
        <span className="absolute right-0 top-0 rounded-bl-lg bg-primary-600 px-2 py-0.5 text-[10px] text-white">
          Ativo
        </span>
      ) : null}

      <div className="flex items-center gap-3 border-b border-neutral-200 p-4 dark:border-neutral-700">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-xs font-medium text-neutral-600">
          {plano.logoUrl ? <img src={plano.logoUrl} className="h-11 w-11 rounded-lg object-cover" /> : plano.nome.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{plano.nome}</div>
          <div className="truncate text-xs text-neutral-400">
            {plano.orgao} • {plano.cargo}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center">
        <Stat value={String(stats.disciplinas)} label="Disciplinas" />
        <Stat value={`${stats.estudados}/${stats.total}`} label="Tópicos" />
        <Stat value={`${stats.pct}%`} label="Conclusão" />
      </div>

      <div className="px-4 pb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
          <span>Progresso geral</span>
          <span>{stats.pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}>{plano.status}</span>
          {plano.dataProva ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
              <Calendar className="h-3 w-3" />
              {plano.dataProva}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!plano.ativo ? (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] text-primary-600 hover:bg-primary-50"
              onClick={() => onAtivar(plano.id)}
            >
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ativar
              </span>
            </button>
          ) : null}
          <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100" onClick={() => onEditar(plano)}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded-md p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => onExcluir(plano)}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-medium text-neutral-800 dark:text-neutral-100">{value}</div>
      <div className="text-[10px] text-neutral-400">{label}</div>
    </div>
  );
}

