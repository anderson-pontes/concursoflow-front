import React from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { chartStripClass } from "@/lib/palette/chart-strip";
import { fmtPeso, fmtPontos, getDisciplinaTotalPontos } from "@/lib/disciplinas/pontos";
import { getDisciplinaStatusLabel } from "./disciplinaProgress";

export type DisciplinaCardModel = {
  id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  total_pontos?: number | null;
  ordem: number;
};

type DisciplinaCardProps = {
  disciplina: DisciplinaCardModel;
  stats: { total: number; studied: number; pct: number };
  inConcurso: boolean;
  concursoCount?: number;
  canToggleConcurso: boolean;
  onToggleConcurso: () => void;
  onEdit: () => void;
  onConfirmDelete: () => void | Promise<void>;
  /** Índice na listagem — define cor alternada da faixa superior */
  index?: number;
};

/** Paleta cíclica da faixa superior (3px) — identidade visual por posição na lista */
function topStripClass(index: number) {
  return chartStripClass(index);
}

function headerIconBox(inConcurso: boolean, kind: string) {
  if (!inConcurso) return { box: "bg-warning/10 dark:bg-warning/10", emoji: "📂" as const };
  if (kind === "sem_topicos") return { box: "bg-primary-muted dark:bg-[var(--ap-brand-light)]", emoji: "📋" as const };
  if (kind === "concluida") return { box: "bg-success/10 dark:bg-success/10", emoji: "✅" as const };
  if (kind === "iniciando") return { box: "bg-primary-muted dark:bg-[var(--ap-brand-light)]", emoji: "📋" as const };
  return { box: "bg-success/10 dark:bg-success/10", emoji: "📖" as const };
}

function statusBadgeClass(inConcurso: boolean, kind: string) {
  if (!inConcurso) return "bg-warning/15 text-warning dark:bg-warning/10 dark:text-warning";
  if (kind === "sem_topicos") return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";
  if (kind === "concluida") return "bg-accent text-primary dark:bg-accent dark:text-primary-400";
  if (kind === "iniciando") return "bg-success/15 text-success dark:bg-success/10 dark:text-success-400";
  return "bg-success/15 text-success dark:bg-success/10 dark:text-success-400";
}

function statusBadgeLabel(inConcurso: boolean, stats: { total: number; studied: number }) {
  if (!inConcurso) return "Fora do concurso";
  const { label, kind } = getDisciplinaStatusLabel(stats);
  if (kind === "iniciando") return "Em progresso";
  return label;
}

function progressFillClass(inConcurso: boolean, kind: string, pct: number) {
  if (!inConcurso) return "bg-warning";
  if (kind === "sem_topicos" || pct === 0) return "bg-transparent";
  if (kind === "concluida") return "bg-primary";
  return "bg-success";
}

function pctColorClass(pct: number) {
  if (pct >= 70) return "text-success";
  if (pct >= 40) return "text-warning";
  return "text-destructive";
}

export function DisciplinaCard({
  disciplina,
  stats,
  inConcurso,
  concursoCount = 0,
  canToggleConcurso,
  onToggleConcurso,
  onEdit,
  onConfirmDelete,
  index = 0,
}: DisciplinaCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [barReady, setBarReady] = React.useState(false);
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  const status = getDisciplinaStatusLabel(stats);
  const kind = status.kind;
  const restantes = Math.max(0, stats.total - stats.studied);
  const totalPontos = getDisciplinaTotalPontos(disciplina);
  const hasEditalInfo = disciplina.peso != null && totalPontos != null && totalPontos > 0;

  React.useEffect(() => {
    setBarReady(false);
    const t = requestAnimationFrame(() => setBarReady(true));
    return () => cancelAnimationFrame(t);
  }, [stats.pct, disciplina.id, inConcurso]);

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

  React.useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const goPainel = React.useCallback(() => {
    if (pendingDelete) return;
    navigate(`/disciplinas/${disciplina.id}`, {
      state: { disciplinaId: disciplina.id, nome: disciplina.nome },
    });
  }, [disciplina.id, disciplina.nome, navigate, pendingDelete]);

  const armDelete = () => {
    setMenuOpen(false);
    setPendingDelete(true);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => {
      setPendingDelete(false);
      deleteTimerRef.current = null;
    }, 3000);
  };

  const cancelDelete = () => {
    setPendingDelete(false);
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  };

  const confirmDelete = async () => {
    cancelDelete();
    await onConfirmDelete();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir painel de ${disciplina.nome}`}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] font-sans shadow-card transition-all duration-200 ease-out outline-none",
        "hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md",
        "dark:hover:border-primary-800 dark:focus-visible:ring-offset-[var(--bg-page)]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
      onClick={goPainel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goPainel();
        }
      }}
    >
      <div className={cn("h-[3px] w-full", topStripClass(index))} aria-hidden />

      <div className="px-5 pb-0 pt-[18px]">
        <div className="flex items-start gap-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none",
              headerIconBox(inConcurso, kind).box,
            )}
            aria-hidden
          >
            {headerIconBox(inConcurso, kind).emoji}
          </div>
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold leading-tight text-[var(--text-primary)]">{disciplina.nome}</h3>
          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", statusBadgeClass(inConcurso, kind))}>
            {statusBadgeLabel(inConcurso, stats)}
          </span>
          <div
            className="relative shrink-0"
            ref={actionsMenuRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {pendingDelete ? (
              <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="rounded-lg bg-destructive px-2 py-1 text-[11px] font-bold text-white hover:bg-red-600"
                  onClick={() => void confirmDelete()}
                >
                  Confirmar exclusão ✗
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-default)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-muted dark:hover:bg-[var(--bg-surface-hover)]"
                  onClick={cancelDelete}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={`Ações da disciplina ${disciplina.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-[var(--bg-surface-2)] dark:hover:text-[var(--text-primary)]"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 z-[1000] mt-2 min-w-[200px] rounded-xl border border-[var(--border-default)] bg-card p-1.5 shadow-lg dark:bg-[var(--bg-surface-2)]"
                    style={{ animation: "discMenuIn 150ms ease-out" }}
                  >
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3.5 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-primary-muted hover:text-primary dark:hover:bg-surface-muted dark:hover:text-primary-400"
                      onClick={() => {
                        setMenuOpen(false);
                        goPainel();
                      }}
                    >
                      <span className="flex items-center gap-2.5 font-medium">
                        <span aria-hidden>🎯</span> Painel da disciplina
                      </span>
                      <span className="pl-7 text-[11px] text-[var(--text-muted)]">Ver tópicos e progresso</span>
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-muted dark:hover:bg-surface-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                    >
                      <span aria-hidden>✏️</span> Editar disciplina
                    </button>
                    <div className="my-1 h-px bg-[var(--border-subtle)]" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      onClick={armDelete}
                    >
                      <span aria-hidden>🗑️</span> Excluir disciplina
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="text-[var(--text-secondary)]">
            {stats.studied} de {stats.total} tópicos estudados
          </span>
          <span className={cn("font-bold tabular-nums", pctColorClass(stats.pct))}>{stats.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border dark:bg-surface-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              progressFillClass(inConcurso, kind, stats.pct),
            )}
            style={{ width: barReady ? `${stats.pct}%` : "0%" }}
          />
        </div>
      </div>

      {hasEditalInfo ? (
        <div className="mx-5 mb-1 rounded-lg bg-primary-muted px-3 py-2 text-center text-[11px] text-[var(--text-secondary)] dark:bg-surface-muted">
          <span className="font-semibold text-primary dark:text-primary-400">{fmtPontos(totalPontos)} pts</span>
          <span className="mx-1.5 text-[var(--text-muted)]">·</span>
          peso {fmtPeso(disciplina.peso)} no edital
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 px-5 pb-3.5 text-center">
        <div>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{stats.total}</div>
          <div className="text-[11px] text-[var(--text-muted)]">tópicos</div>
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{stats.studied}</div>
          <div className="text-[11px] text-[var(--text-muted)]">estudados</div>
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{restantes}</div>
          <div className="text-[11px] text-[var(--text-muted)]">restantes</div>
        </div>
      </div>

      <div
        className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={!canToggleConcurso}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity",
            inConcurso
              ? "bg-accent text-primary dark:bg-accent dark:text-primary-400"
              : "bg-warning/15 text-warning dark:bg-warning/10 dark:text-warning",
            !canToggleConcurso && "cursor-not-allowed opacity-45",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleConcurso();
          }}
        >
          {inConcurso ? "✓ No concurso" : "⚠ Fora do concurso"}
        </button>
        {concursoCount > 1 ? (
          <span className="text-[11px] text-[var(--text-muted)]">{concursoCount} concursos</span>
        ) : null}
        <button
          type="button"
          className="text-xs text-[var(--text-muted)] transition-colors hover:text-primary hover:underline dark:hover:text-primary-400"
          onClick={goPainel}
        >
          Ver painel →
        </button>
      </div>
    </div>
  );
}
