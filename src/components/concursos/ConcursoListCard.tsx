import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { acertoPctTextClass } from "@/lib/concursoProgressStorage";
import type { Concurso } from "@/lib/concursos/types";
import { isEncerradoStatus } from "@/lib/concursos/utils";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";

export type ConcursoCardStats = {
  disciplinasCount: number;
  questoesTotal: number;
  acertoMedioPct: number;
};

type Props = {
  concurso: Concurso;
  cardTotals: ConcursoCardStats | null;
  pendingDeleteId: string | null;
  deletePending: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onDeletePrompt: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

function formatDataProva(value: string | null | undefined) {
  if (!value) return null;
  try {
    const d = parseISO(value);
    if (!isValid(d)) return value;
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
}

export function ConcursoListCard({
  concurso: c,
  cardTotals,
  pendingDeleteId,
  deletePending,
  onViewDetails,
  onEdit,
  onDeletePrompt,
  onConfirmDelete,
  onCancelDelete,
}: Props) {
  const logo = resolvePublicUrl(c.logo_url);
  const editalHref = resolvePublicUrl(c.edital_url);
  const encerrado = isEncerradoStatus(c.status);
  const cargoTitulo = c.cargo?.trim() || c.nome;
  const orgaoBanca = [c.orgao, c.banca].filter(Boolean).join(" · ") || "—";
  const dataProva = formatDataProva(c.data_prova);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border-x border-b border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] transition-all duration-200 ease-out",
        encerrado ? "border-t-[3px] border-t-[#9CA3AF]" : "border-t-[3px] border-t-[#6C3FC5]",
        "hover:-translate-y-0.5 hover:border-x-[#C4B5FD] hover:border-b-[#C4B5FD] hover:shadow-[0_8px_32px_rgba(108,63,197,0.12)]",
      )}
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div className="px-5 pb-0 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--border-default)] bg-[#F3F0FF] dark:bg-[var(--ap-brand-light)]">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl leading-none" aria-hidden>
                🏛️
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-base font-bold text-[var(--text-primary)]">{cargoTitulo}</h3>
            <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{orgaoBanca}</p>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
              {encerrado ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#6B7280]">
                  Encerrado
                </span>
              ) : c.status === "suspenso" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#D97706]">
                  Suspenso
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs font-semibold text-[#16A34A]">
                  <span className="concurso-dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
                  Ativo
                </span>
              )}
              {dataProva ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F3F0FF] px-2.5 py-1 text-[11px] font-semibold text-[#6C3FC5] dark:bg-[var(--ap-brand-light)]">
                  📅 {dataProva}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border-subtle)] px-5 py-4">
        <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Disciplinas</p>
            <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
              {cardTotals ? cardTotals.disciplinasCount : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Questões</p>
            <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
              {cardTotals ? cardTotals.questoesTotal : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">% Acerto</p>
            {cardTotals ? (
              <p className={cn("mt-1 text-sm font-bold tabular-nums", acertoPctTextClass(cardTotals.acertoMedioPct))}>
                {cardTotals.acertoMedioPct}%
              </p>
            ) : (
              <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-nowrap items-center gap-2 overflow-hidden border-t border-[var(--border-subtle)] px-5 py-4">
        <button
          type="button"
          className="inline-flex min-w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          onClick={onViewDetails}
        >
          Ver detalhes
        </button>
        <button
          type="button"
          className="inline-flex min-w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          onClick={onEdit}
        >
          Editar
        </button>
        {editalHref ? (
          <a
            href={editalHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#F3F0FF] px-3 py-1.5 text-[13px] font-bold text-[#6C3FC5] dark:bg-[var(--ap-brand-light)]"
          >
            Edital
          </a>
        ) : null}
        <div className="ml-auto flex min-w-[36px] shrink-0 items-center justify-end">
          {pendingDeleteId === c.id ? (
            <div className="flex flex-nowrap items-center gap-1.5">
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-lg bg-[#EF4444] px-2 py-1.5 text-[11px] font-bold text-white hover:bg-red-600"
                onClick={onConfirmDelete}
                disabled={deletePending}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-lg border border-[var(--border-default)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)]"
                onClick={onCancelDelete}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-9 min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-lg leading-none text-[var(--text-muted)] hover:bg-[#FFF5F5] hover:text-[#EF4444]"
              aria-label="Excluir concurso"
              onClick={onDeletePrompt}
              disabled={deletePending}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
