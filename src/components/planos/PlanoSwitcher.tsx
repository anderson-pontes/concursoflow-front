import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { usePlanoStore } from "@/stores/planoStore";

type PlanoSwitcherProps = {
  /** Sidebar estreita (72px): só ícone 🎯 + dropdown à direita */
  collapsed?: boolean;
  /** Ex.: fechar drawer mobile após escolher plano */
  onAfterPick?: () => void;
};

export function PlanoSwitcher({ collapsed = false, onAfterPick }: PlanoSwitcherProps) {
  const navigate = useNavigate();
  const planos = usePlanoStore((s) => s.planos);
  const planoAtivoId = usePlanoStore((s) => s.planoAtivoId);
  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const setPlanoAtivo = usePlanoStore((s) => s.setPlanoAtivo);

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ativo = planos.find((p) => p.id === planoAtivoId) ?? null;

  React.useEffect(() => {
    if (planos.length === 0) {
      loadPlanos().catch(() => {});
    }
  }, [loadPlanos, planos.length]);

  React.useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const displayName = ativo?.nome ?? "Selecionar plano";
  const tooltipTitle = displayName;

  const triggerCollapsed = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      title={tooltipTitle}
      className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] text-base transition-[border-color,background-color] duration-200 ease-out hover:border-[#6C3FC5] dark:hover:border-[#6C3FC5]"
      onClick={() => setOpen((v) => !v)}
    >
      <span className="pointer-events-none" aria-hidden>
        🎯
      </span>
    </button>
  );

  const triggerExpanded = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] px-3 py-2.5 text-left transition-[border-color,background-color] duration-200 ease-out hover:border-[#6C3FC5] dark:hover:border-[#6C3FC5]"
      onClick={() => setOpen((v) => !v)}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE] text-base dark:bg-[#2D2540]"
        aria-hidden
      >
        🎯
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9CA3AF]">Concurso ativo</div>
        <div className="truncate text-[13px] font-bold text-[#1A1A2E] dark:text-[#F1F0FF]">{displayName}</div>
      </div>
      <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
    </button>
  );

  const panel = open ? (
    <div
      className={cn(
        "absolute z-[130] rounded-xl border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-600 dark:bg-neutral-900 dark:shadow-lg",
        collapsed ? "left-full top-0 ml-2 w-[260px]" : "left-0 right-0 mt-2",
      )}
    >
      <div className="px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">Plano ativo</div>

      <div className="space-y-1">
        {planos.map((p) => (
          <button
            key={p.id}
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
            onClick={() => {
              setPlanoAtivo(p.id);
              setOpen(false);
              toast.success(`Plano alterado para ${p.nome}`);
              onAfterPick?.();
            }}
          >
            <div className="h-7 w-7 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
              {p.logoUrl ? <img src={p.logoUrl} className="h-7 w-7 object-cover" alt="" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{p.nome}</div>
              <div className="truncate text-xs text-neutral-400">{p.orgao}</div>
            </div>
            {p.id === planoAtivoId ? <Check className="ml-auto h-3.5 w-3.5 text-[#6C3FC5]" aria-hidden /> : null}
          </button>
        ))}
      </div>

      <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#6C3FC5] hover:bg-[#F3F0FF] dark:text-[#A78BFA] dark:hover:bg-[#1E1A2E]"
        onClick={() => {
          setOpen(false);
          navigate("/concursos/planos");
          onAfterPick?.();
        }}
      >
        + Gerenciar planos
      </button>
    </div>
  ) : null;

  return (
    <div className={cn("relative shrink-0", collapsed ? "flex justify-center px-0 pt-3" : "mx-3 mt-3")} ref={rootRef}>
      {collapsed ? triggerCollapsed : triggerExpanded}
      {panel}
    </div>
  );
}
