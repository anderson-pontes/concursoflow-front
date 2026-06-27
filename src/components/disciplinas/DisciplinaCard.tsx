import React from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { fmtPeso, fmtPontos, getDisciplinaTotalPontos } from "@/lib/disciplinas/pontos";
import { getDisciplinaStatusLabel } from "./disciplinaProgress";

export type DisciplinaCardModel = {
  id: string;
  nome: string;
  sigla: string | null;
  peso: number | null;
  total_questoes_prova: number | null;
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
const TOP_STRIP_COLORS = [
  "bg-[#6C3FC5]", // roxo marca
  "bg-[#22C55E]", // verde
  "bg-[#3B82F6]", // azul
  "bg-[#F59E0B]", // âmbar
  "bg-[#EC4899]", // rosa
  "bg-[#14B8A6]", // teal
] as const;

function topStripClass(index: number) {
  return TOP_STRIP_COLORS[index % TOP_STRIP_COLORS.length];
}

function headerIconBox(inConcurso: boolean, kind: string) {
  if (!inConcurso) return { box: "bg-[#FFFBEB] dark:bg-[#2D1F0A]", emoji: "📂" as const };
  if (kind === "sem_topicos") return { box: "bg-[#F3F0FF] dark:bg-[var(--ap-brand-light)]", emoji: "📋" as const };
  if (kind === "concluida") return { box: "bg-[#F0FDF4] dark:bg-[#052E16]", emoji: "✅" as const };
  if (kind === "iniciando") return { box: "bg-[#F3F0FF] dark:bg-[var(--ap-brand-light)]", emoji: "📋" as const };
  return { box: "bg-[#F0FDF4] dark:bg-[#052E16]", emoji: "📖" as const };
}

function statusBadgeClass(inConcurso: boolean, kind: string) {
  if (!inConcurso) return "bg-[#FEF3C7] text-[#D97706] dark:bg-[#2D1F0A] dark:text-[#F59E0B]";
  if (kind === "sem_topicos") return "bg-[#F3F4F6] text-[#6B7280] dark:bg-[#1F2937] dark:text-[#6B7280]";
  if (kind === "concluida") return "bg-[#EDE9FE] text-[#6C3FC5] dark:bg-[#2D2540] dark:text-[#A78BFA]";
  if (kind === "iniciando") return "bg-[#DCFCE7] text-[#16A34A] dark:bg-[#052E16] dark:text-[#4ADE80]";
  return "bg-[#DCFCE7] text-[#16A34A] dark:bg-[#052E16] dark:text-[#4ADE80]";
}

function statusBadgeLabel(inConcurso: boolean, stats: { total: number; studied: number }) {
  if (!inConcurso) return "Fora do concurso";
  const { label, kind } = getDisciplinaStatusLabel(stats);
  if (kind === "iniciando") return "Em progresso";
  return label;
}

function progressFillClass(inConcurso: boolean, kind: string, pct: number) {
  if (!inConcurso) return "bg-[#F59E0B]";
  if (kind === "sem_topicos" || pct === 0) return "bg-transparent";
  if (kind === "concluida") return "bg-[#6C3FC5]";
  return "bg-[#22C55E]";
}

function pctColorClass(pct: number) {
  if (pct >= 70) return "text-[#16A34A]";
  if (pct >= 40) return "text-[#D97706]";
  return "text-[#EF4444]";
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
  const hasEditalInfo =
    disciplina.total_questoes_prova != null && disciplina.peso != null && totalPontos != null;

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
        "group cursor-pointer overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out outline-none",
        "hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:shadow-[0_8px_28px_rgba(108,63,197,0.12)]",
        "dark:hover:border-[#3D3060] dark:focus-visible:ring-offset-[var(--bg-page)]",
        "focus-visible:ring-2 focus-visible:ring-[#6C3FC5] focus-visible:ring-offset-2",
      )}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
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
                  className="rounded-lg bg-[#EF4444] px-2 py-1 text-[11px] font-bold text-white hover:bg-red-600"
                  onClick={() => void confirmDelete()}
                >
                  Confirmar exclusão ✗
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-default)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[#F9FAFB] dark:hover:bg-[var(--bg-surface-hover)]"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A2E] dark:hover:bg-[var(--bg-surface-2)] dark:hover:text-[var(--text-primary)]"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 z-[1000] mt-2 min-w-[200px] rounded-xl border border-[var(--border-default)] bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-[var(--border-default)] dark:bg-[var(--bg-surface-2)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                    style={{ animation: "discMenuIn 150ms ease-out" }}
                  >
                    <style>{`
                      @keyframes discMenuIn {
                        from { opacity: 0; transform: translateY(-4px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3.5 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[#F3F0FF] hover:text-[#6C3FC5] dark:hover:bg-[#1E1A2E] dark:hover:text-[#A78BFA]"
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
                      className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[#F9FAFB] dark:hover:bg-[#1A1726]"
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
                      className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#FFF5F5] dark:hover:bg-[rgba(239,68,68,0.12)]"
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
        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E1A2E]">
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
        <div className="mx-5 mb-1 rounded-lg bg-[#FAF5FF] px-3 py-2 text-center text-[11px] text-[var(--text-secondary)] dark:bg-[#1E1A2E]">
          <span className="font-semibold text-[#6C3FC5] dark:text-[#A78BFA]">{fmtPontos(totalPontos)} pts</span>
          <span className="mx-1.5 text-[var(--text-muted)]">·</span>
          {disciplina.total_questoes_prova} questões
          <span className="mx-1.5 text-[var(--text-muted)]">·</span>
          peso {fmtPeso(disciplina.peso)}
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
              ? "bg-[#EDE9FE] text-[#6C3FC5] dark:bg-[#2D2540] dark:text-[#A78BFA]"
              : "bg-[#FEF3C7] text-[#D97706] dark:bg-[#2D1F0A] dark:text-[#F59E0B]",
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
          className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#6C3FC5] hover:underline dark:hover:text-[#A78BFA]"
          onClick={goPainel}
        >
          Ver painel →
        </button>
      </div>
    </div>
  );
}
