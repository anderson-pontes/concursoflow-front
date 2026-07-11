import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { usePlanoStore } from "@/stores/planoStore";

type PlanoSwitcherProps = {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onAfterPick?: () => void;
};

export function PlanoSwitcher({ collapsed = false, mobileOpen = false, onAfterPick }: PlanoSwitcherProps) {
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

  React.useEffect(() => {
    if (!mobileOpen) setOpen(false);
  }, [mobileOpen]);

  const displayName = ativo?.nome ?? "Selecionar plano";

  const triggerClass =
    "flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const triggerCollapsed = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      title={displayName}
      className={cn(triggerClass, "mx-auto h-11 w-11 shrink-0 justify-center px-0")}
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
      className={cn(triggerClass, "w-full px-3 py-2 text-left")}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-base" aria-hidden>
        🎯
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Plano ativo</div>
        <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
      </div>
      <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );

  const panel = open ? (
    <div
      className={cn(
        "z-[130] rounded-xl border border-border bg-surface p-2 shadow-md",
        collapsed && !mobileOpen
          ? "absolute left-full top-0 ml-2 w-[min(260px,calc(100vw-5rem))]"
          : "absolute left-0 right-0 mt-2 max-h-[min(16rem,50vh)] overflow-y-auto",
      )}
      role="listbox"
      aria-label="Selecionar plano"
    >
      <div className="px-2 py-1 text-xs text-muted-foreground">Plano ativo</div>
      <div className="space-y-1">
        {planos.map((p) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={p.id === planoAtivoId}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-surface-hover"
            onClick={() => {
              setPlanoAtivo(p.id);
              setOpen(false);
              toast.success(`Plano alterado para ${p.nome}`);
              onAfterPick?.();
            }}
          >
            <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
              {p.logoUrl ? <img src={p.logoUrl} className="h-8 w-8 object-cover" alt="" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{p.nome}</div>
              <div className="truncate text-xs text-muted-foreground">{p.orgao}</div>
            </div>
            {p.id === planoAtivoId ? <Check className="ml-auto h-4 w-4 text-primary" aria-hidden /> : null}
          </button>
        ))}
      </div>
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-xs font-medium text-primary hover:bg-surface-hover"
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
    <div
      className={cn("relative shrink-0", collapsed && !mobileOpen ? "flex justify-center px-0 pt-3" : "mx-3 mt-3")}
      ref={rootRef}
    >
      {collapsed && !mobileOpen ? triggerCollapsed : triggerExpanded}
      {panel}
    </div>
  );
}
