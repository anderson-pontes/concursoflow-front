import React from "react";
import {
  Link2,
  Link2Off,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { chartStripClass } from "@/lib/palette/chart-strip";
import {
  fmtPeso,
  fmtPontos,
  getDisciplinaPesoEdital,
  getDisciplinaPrioridade,
} from "@/lib/disciplinas/pontos";
import { getDisciplinaStatusLabel } from "./disciplinaProgress";

export type DisciplinaCardModel = {
  id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  total_pontos?: number | null;
  prioridade_calculada?: number | null;
  ordem: number;
};

type DisciplinaCardProps = {
  disciplina: DisciplinaCardModel;
  stats: { total: number; studied: number; pct: number };
  inConcurso: boolean;
  /** Há concurso ativo — controla badge “Fora do concurso” e item de vínculo no menu */
  canToggleConcurso: boolean;
  onToggleConcurso: () => void;
  onEdit: () => void;
  onConfirmDelete: () => void | Promise<void>;
  /** Índice na listagem — define cor alternada da faixa superior */
  index?: number;
};

function topStripClass(index: number) {
  return chartStripClass(index);
}

function statusBadgeClass(foraDoConcurso: boolean, kind: string) {
  if (foraDoConcurso) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  if (kind === "sem_topicos") return "bg-muted text-muted-foreground";
  if (kind === "concluida") return "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
}

function statusBadgeLabel(foraDoConcurso: boolean, stats: { total: number; studied: number }) {
  if (foraDoConcurso) return "Fora do concurso";
  const { label, kind } = getDisciplinaStatusLabel(stats);
  if (kind === "iniciando") return "Em progresso";
  return label;
}

function progressFillClass(foraDoConcurso: boolean, kind: string, pct: number) {
  if (foraDoConcurso) return "bg-amber-400/80";
  if (kind === "sem_topicos" || pct === 0) return "bg-transparent";
  if (kind === "concluida") return "bg-primary-500";
  return "bg-emerald-500";
}

function pctColorClass(pct: number) {
  if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function DisciplinaCard({
  disciplina,
  stats,
  inConcurso,
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
  const foraDoConcurso = canToggleConcurso && !inConcurso;
  const pesoEdital = getDisciplinaPesoEdital(disciplina);
  const prioridade = getDisciplinaPrioridade(disciplina);

  const metaBits: string[] = [];
  if (disciplina.sigla?.trim()) metaBits.push(disciplina.sigla.trim());
  if (prioridade != null && prioridade > 0) metaBits.push(`Prioridade ${fmtPontos(prioridade)}`);
  if (pesoEdital != null && pesoEdital > 0) metaBits.push(`Peso ${fmtPeso(pesoEdital)}`);

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

  const menuElevated = menuOpen || pendingDelete;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Abrir painel de ${disciplina.nome}`}
      className={cn(
        "group relative cursor-pointer overflow-visible rounded-xl border border-border bg-card shadow-sm outline-none transition-all duration-200",
        "hover:border-primary-300 hover:shadow-md dark:hover:border-primary-800",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        menuElevated && "z-30",
      )}
      onClick={goPainel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goPainel();
        }
      }}
    >
      <div className="overflow-hidden rounded-t-xl">
        <div className={cn("h-[3px] w-full", topStripClass(index))} aria-hidden />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-card-foreground">
            {disciplina.nome}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              statusBadgeClass(foraDoConcurso, kind),
            )}
          >
            {statusBadgeLabel(foraDoConcurso, stats)}
          </span>
          <div
            className="relative shrink-0"
            ref={actionsMenuRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
          {pendingDelete ? (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                className="rounded-md bg-destructive px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600"
                onClick={() => void confirmDelete()}
              >
                Confirmar exclusão
              </button>
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
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
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 min-w-[13.5rem] rounded-lg border border-border bg-card p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      goPainel();
                    }}
                  >
                    <PanelRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    Abrir painel
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    Editar disciplina
                  </button>
                  {canToggleConcurso ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleConcurso();
                      }}
                    >
                      {inConcurso ? (
                        <Link2Off className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      ) : (
                        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      {inConcurso ? "Remover do concurso" : "Incluir no concurso"}
                    </button>
                  ) : null}
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                    onClick={armDelete}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                    Excluir disciplina
                  </button>
                </div>
              ) : null}
            </>
          )}
          </div>
        </div>

        {metaBits.length > 0 ? (
          <p className="mt-1.5 truncate text-xs text-muted-foreground" title={metaBits.join(" · ")}>
            {metaBits.join(" · ")}
          </p>
        ) : null}

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground tabular-nums">
              {stats.studied}/{stats.total} tópicos estudados
            </span>
            <span className={cn("font-semibold tabular-nums", pctColorClass(stats.pct))}>{stats.pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 ease-out",
                progressFillClass(foraDoConcurso, kind, stats.pct),
              )}
              style={{ width: barReady ? `${stats.pct}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
