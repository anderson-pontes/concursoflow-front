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
  if (pct >= 70) return "text-success";
  if (pct >= 40) return "text-warning";
  return "text-destructive";
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
        "group cursor-pointer overflow-hidden rounded-2xl border-[1.5px] border-border bg-card transition-all duration-200 ease-out",
        "shadow-sm hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:hover:border-primary-800",
      )}
    >
      <div className={cn("h-1", plano.ativo ? "bg-primary" : "bg-muted")} />

      <div className="flex items-start gap-3 px-5 pb-0 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-muted text-base font-bold text-primary">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            iniciais
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-base font-bold text-foreground">{plano.nome}</h3>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
            {plano.orgao} • {plano.cargo}
          </p>
        </div>
        <div className="shrink-0">
          {plano.ativo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="plano-card-dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              ○ Inativo
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border-subtle px-5 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[22px] font-bold leading-tight text-foreground">{stats.disciplinas}</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Disciplinas</div>
          </div>
          <div>
            <div className="text-[22px] font-bold leading-tight text-foreground">
              {stats.estudados}/{stats.total}
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tópicos</div>
          </div>
          <div>
            <div className={cn("text-[22px] font-bold leading-tight", conclusaoTextClass(stats.pct))}>
              {stats.pct}%
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Conclusão</div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="mb-1.5 flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="font-bold tabular-nums text-primary">{stats.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-500 transition-[width] duration-[600ms] ease-out"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div
        className="flex items-center gap-2 border-t border-border-subtle px-5 py-3 pb-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
            plano.ativo
              ? "bg-primary-muted text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {plano.ativo ? "ativo" : "inativo"}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden>📅</span>
          <span className="truncate">{dataFmt ?? "Sem data definida"}</span>
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {!plano.ativo ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-muted"
              onClick={() => onAtivar(plano.id)}
            >
              <span aria-hidden>✓</span> Ativar
            </button>
          ) : null}
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-base transition-colors hover:bg-primary-muted hover:text-primary"
            aria-label="Editar plano"
            onClick={() => onEditar(plano)}
          >
            ✏️
          </button>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-base text-destructive transition-colors hover:bg-destructive/10"
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
