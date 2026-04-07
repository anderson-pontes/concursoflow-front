import React from "react";
import { useNavigate } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";
import type { PlanoEstudo } from "@/types/plano";

function calcStats(plano: PlanoEstudo) {
  const fallback = { disciplinas_qty: 0, topicos_estudados: 0, topicos_total: 0, progresso_pct: 0 };
  const stats = plano.stats ?? fallback;
  return {
    disciplinas: stats.disciplinas_qty,
    estudados: stats.topicos_estudados,
    total: stats.topicos_total,
    pct: stats.progresso_pct,
  };
}

function formatProvaDate(s?: string): string | null {
  if (!s?.trim()) return null;
  try {
    const d = parseISO(s);
    if (!isValid(d)) return s;
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return s;
  }
}

function conclusaoTextClass(pct: number) {
  if (pct >= 70) return "text-[#16A34A]";
  if (pct >= 40) return "text-[#F59E0B]";
  return "text-[#EF4444]";
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
  const logoSrc = resolvePublicUrl(plano.logoUrl ?? null);
  const dataFmt = formatProvaDate(plano.dataProva);

  const [barPct, setBarPct] = React.useState(0);
  React.useEffect(() => {
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(stats.pct), 40);
    return () => window.clearTimeout(t);
  }, [stats.pct, plano.id]);

  const iniciais = plano.nome.trim().slice(0, 2).toUpperCase() || "PL";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/concursos/planos/${plano.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/concursos/planos/${plano.id}`);
        }
      }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] transition-all duration-200 ease-out",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:shadow-[0_8px_32px_rgba(108,63,197,0.13)]",
        "dark:hover:border-[#3D3060]",
      )}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className={cn("h-1", plano.ativo ? "bg-[#6C3FC5]" : "bg-[#D1D5DB] dark:bg-[#2D2540]")} />

      <div className="flex items-start gap-3 px-5 pb-0 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#F3F0FF] text-base font-bold text-[#6C3FC5] dark:bg-[#2D2540] dark:text-[#A78BFA]">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            iniciais
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-base font-bold text-[var(--text-primary)]">{plano.nome}</h3>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-[var(--text-secondary)]">
            {plano.orgao} • {plano.cargo}
          </p>
        </div>
        <div className="shrink-0">
          {plano.ativo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-xs font-semibold text-[#16A34A] dark:bg-[#052E16] dark:text-[#4ADE80]">
              <span className="plano-card-dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A] dark:bg-[#4ADE80]" aria-hidden />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#9CA3AF] dark:bg-[#1F2937] dark:text-[#6B7280]">
              ○ Inativo
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border-subtle)] px-5 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[22px] font-bold leading-tight text-[var(--text-primary)]">{stats.disciplinas}</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Disciplinas</div>
          </div>
          <div>
            <div className="text-[22px] font-bold leading-tight text-[var(--text-primary)]">
              {stats.estudados}/{stats.total}
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Tópicos</div>
          </div>
          <div>
            <div className={cn("text-[22px] font-bold leading-tight", conclusaoTextClass(stats.pct))}>
              {stats.pct}%
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Conclusão</div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="mb-1.5 flex items-center justify-between text-[13px]">
          <span className="text-[var(--text-secondary)]">Progresso geral</span>
          <span className="font-bold tabular-nums text-[#6C3FC5] dark:text-[#A78BFA]">{stats.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E1A2E]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6C3FC5] to-[#8B5CF6] transition-[width] duration-[600ms] ease-out"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div
        className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-5 py-3 pb-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
            plano.ativo
              ? "bg-[#EDE9FE] text-[#6C3FC5] dark:bg-[#052E16] dark:text-[#4ADE80]"
              : "bg-[#F3F4F6] text-[#9CA3AF] dark:bg-[#1F2937] dark:text-[#6B7280]",
          )}
        >
          {plano.ativo ? "ativo" : "inativo"}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-xs text-[var(--text-muted)]">
          <span aria-hidden>📅</span>
          <span className="truncate">{dataFmt ?? "Sem data definida"}</span>
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {!plano.ativo ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#6C3FC5] transition-colors hover:bg-[#F3F0FF] dark:border-[#3D3060] dark:bg-[#1E1A2E] dark:text-[#A78BFA] dark:hover:bg-[#2D2540]"
              onClick={() => onAtivar(plano.id)}
            >
              <span aria-hidden>✓</span> Ativar
            </button>
          ) : null}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors hover:bg-[#F3F0FF] hover:text-[#6C3FC5] dark:hover:bg-[#1E1A2E] dark:hover:text-[#A78BFA]"
            aria-label="Editar plano"
            onClick={() => onEditar(plano)}
          >
            ✏️
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base text-[#EF4444] transition-colors hover:bg-[#FFF5F5] hover:opacity-90 dark:hover:bg-[rgba(239,68,68,0.12)]"
            aria-label="Excluir plano"
            onClick={() => onExcluir(plano)}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
