import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenCheck, LayoutDashboard, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { DISCIPLINA_PALETTES, getDisciplinaPaletteIndex } from "./disciplinaPalettes";
import { getDisciplinaStatusLabel } from "./disciplinaProgress";

export type DisciplinaCardModel = {
  id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  ordem: number;
};

type DisciplinaCardProps = {
  disciplina: DisciplinaCardModel;
  stats: { total: number; studied: number; pct: number };
  inPlano: boolean;
  canTogglePlano: boolean;
  onTogglePlano: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function DisciplinaCard({
  disciplina,
  stats,
  inPlano,
  canTogglePlano,
  onTogglePlano,
  onEdit,
  onDelete,
}: DisciplinaCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  const palette = DISCIPLINA_PALETTES[getDisciplinaPaletteIndex(disciplina.id)];
  const status = getDisciplinaStatusLabel(stats);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = actionsMenuRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const goPainel = React.useCallback(() => {
    navigate(`/disciplinas/${disciplina.id}`);
  }, [disciplina.id, navigate]);

  const onCardActivate = React.useCallback(() => {
    goPainel();
  }, [goPainel]);

  const onCardKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goPainel();
      }
    },
    [goPainel],
  );

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Abrir painel de ${disciplina.nome}`}
      className={cn(
        "rounded-xl border p-4 shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:shadow-none dark:ring-offset-neutral-900",
        palette.cardBg,
        palette.cardBorder,
      )}
      onClick={onCardActivate}
      onKeyDown={onCardKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpenCheck className={cn("h-4 w-4 shrink-0", palette.accent)} />
            <h3 className="truncate text-sm font-semibold text-foreground">{disciplina.nome}</h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                status.kind === "sem_topicos" && "bg-muted text-muted-foreground",
                status.kind === "concluida" && "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
                status.kind === "iniciando" && "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
                status.kind === "em_progresso" && "bg-primary/15 text-primary-800 dark:bg-primary/25 dark:text-primary-200",
              )}
            >
              {status.label}
            </span>
          </div>
          <div className={cn("mt-1 text-xs", palette.muted)}>
            {disciplina.sigla ? `${disciplina.sigla} • ` : ""}Ordem {disciplina.ordem}
            {disciplina.peso != null ? ` • Peso ${disciplina.peso}` : ""}
          </div>
        </div>
        <div className="relative shrink-0" ref={actionsMenuRef} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-expanded={menuOpen}
            className="rounded-md border border-border/80 bg-background/60 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-muted dark:border-neutral-600"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md dark:border-neutral-600 dark:bg-neutral-900">
              <Link
                to={`/disciplinas/${disciplina.id}`}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted dark:hover:bg-neutral-800"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Painel da disciplina
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted dark:hover:bg-neutral-800"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {stats.studied}/{stats.total} tópicos estudados
          </span>
          <span>{stats.pct}%</span>
        </div>
        <div className={cn("h-1.5 rounded-full", palette.progressTrack)}>
          <div
            className={cn("h-full rounded-full transition-all", palette.progressFill)}
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-start">
        <button
          type="button"
          disabled={!canTogglePlano}
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            inPlano
              ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-muted/90 text-muted-foreground dark:bg-neutral-800/90 dark:text-neutral-300",
            !canTogglePlano ? "cursor-not-allowed opacity-60" : "hover:opacity-90",
          ].join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlano();
          }}
        >
          {inPlano ? "No plano" : "Fora do plano"}
        </button>
      </div>
    </div>
  );
}
