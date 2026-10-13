import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useListboxNavigation } from "@/hooks/useListboxNavigation";
import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

type ConcursoRow = {
  id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  data_prova: string | null;
};

type ConcursoSwitcherProps = {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onAfterPick?: () => void;
};

export function ConcursoSwitcher({ collapsed = false, mobileOpen = false, onAfterPick }: ConcursoSwitcherProps) {
  const navigate = useNavigate();
  const concursoAtivoId = useConcursoStore((s) => s.concursoAtivoId);
  const transitionConcurso = useConcursoContextTransition();

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoRow[],
  });

  const [open, setOpen] = React.useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const manageRef = React.useRef<HTMLButtonElement>(null);
  const ativo = concursos.find((c) => c.id === concursoAtivoId) ?? null;

  const pickConcurso = React.useCallback(
    async (c: ConcursoRow) => {
      if (c.id === concursoAtivoId) {
        setOpen(false);
        onAfterPick?.();
        return;
      }
      await transitionConcurso(c.id, "sidebar");
      setOpen(false);
      toast.success(`Concurso ativo: ${c.orgao}`);
      onAfterPick?.();
    },
    [concursoAtivoId, transitionConcurso, onAfterPick],
  );

  const { activeIndex, setActiveIndex, onKeyDown: onListboxKeyDown, getOptionId, listboxId, activeId } =
    useListboxNavigation({
      itemCount: concursos.length,
      isOpen: open,
      onSelect: (index) => {
        const c = concursos[index];
        if (c) pickConcurso(c);
      },
      onClose: () => setOpen(false),
      idPrefix: "concurso-switcher",
    });

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    setKeyboardNavigation(true);
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Tab") {
      if (!e.shiftKey) {
        e.preventDefault();
        manageRef.current?.focus();
      } else setOpen(false);
      return;
    }
    if (e.key === "Escape") e.stopPropagation();
    onListboxKeyDown(e);
  };

  React.useEffect(() => {
    if (!open) return;
    const selectedIndex = concursos.findIndex((c) => c.id === concursoAtivoId);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, concursos, concursoAtivoId, setActiveIndex]);

  React.useEffect(() => {
    if (open && keyboardNavigation && activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId, open, keyboardNavigation]);

  React.useEffect(() => {
    if (!mobileOpen) setOpen(false);
  }, [mobileOpen]);

  const displayName = ativo ? `${ativo.orgao} — ${ativo.cargo ?? ativo.nome}` : "Selecionar concurso";

  const triggerClass =
    "flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const triggerCollapsed = (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listboxId : undefined}
      aria-activedescendant={activeId}
      title={displayName}
      className={cn(triggerClass, "mx-auto h-11 w-11 shrink-0 justify-center px-0")}
      onClick={() => { setKeyboardNavigation(false); setOpen((v) => !v); }}
      onKeyDown={onTriggerKeyDown}
    >
      <span aria-hidden>🏆</span>
    </button>
  );

  const triggerExpanded = (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listboxId : undefined}
      aria-activedescendant={activeId}
      className={cn(triggerClass, "w-full px-3 py-2 text-left")}
      onClick={() => { setKeyboardNavigation(false); setOpen((v) => !v); }}
      onKeyDown={onTriggerKeyDown}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-base">
        🏆
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--sidebar-muted)]">Concurso ativo</div>
        <div className="truncate text-sm font-semibold text-sidebar-foreground" title={displayName}>{displayName}</div>
      </div>
      <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[var(--sidebar-muted)]" aria-hidden />
    </button>
  );

  const panel = open ? (
    <PopoverContent
      side={collapsed && !mobileOpen ? "right" : "bottom"}
      align="start"
      sideOffset={8}
      collisionPadding={8}
      avoidCollisions
      onOpenAutoFocus={event => event.preventDefault()}
      onCloseAutoFocus={event => event.preventDefault()}
      onInteractOutside={event => { if (rootRef.current?.contains(event.target as Node)) event.preventDefault(); }}
      onEscapeKeyDown={event => { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }}
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }
        if (event.key === "Tab" && event.target === manageRef.current) {
          event.preventDefault();
          if (event.shiftKey) { triggerRef.current?.focus(); return; }
          setOpen(false);
          const focusables = Array.from(triggerRef.current?.closest("aside")?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? []);
          const index = focusables.indexOf(triggerRef.current!);
          (focusables[index + 1] ?? triggerRef.current)?.focus();
        }
      }}
      className={cn(
        "z-[10060] gap-0 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent p-0 text-sidebar-foreground shadow-lg motion-reduce:animate-none",
        collapsed && !mobileOpen
          ? "w-[min(18rem,calc(100vw-1rem))]"
          : "w-[max(15rem,var(--radix-popover-trigger-width))] max-w-[calc(100vw-1rem)]",
      )}
    >
      <div className="border-b border-sidebar-border px-3 py-2.5">
        <p id={`${listboxId}-label`} className="text-xs font-medium text-[var(--sidebar-muted)]">
          Trocar concurso ativo
        </p>
      </div>
      <div
        className="max-h-[min(18rem,calc(var(--radix-popover-content-available-height)_-_7rem))] min-h-0 space-y-1 overflow-y-auto overscroll-contain p-2"
        role="listbox"
        id={listboxId}
        aria-labelledby={`${listboxId}-label`}
      >
        {concursos.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[var(--sidebar-muted)]">Nenhum concurso cadastrado.</p>
        ) : (
          concursos.map((c, index) => (
            <button
              key={c.id}
              type="button"
              tabIndex={-1}
              role="option"
              id={getOptionId(index)}
              aria-selected={c.id === concursoAtivoId}
              className={cn(
                "flex min-h-12 w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left text-sidebar-foreground transition-colors hover:border-sidebar-foreground hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground focus-visible:ring-inset",
                c.id === concursoAtivoId && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
                index === activeIndex && keyboardNavigation && "ring-2 ring-inset ring-sidebar-foreground",
              )}
              onMouseEnter={() => { setKeyboardNavigation(false); setActiveIndex(index); }}
              onFocus={() => setActiveIndex(index)}
              onClick={() => pickConcurso(c)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium" title={`${c.orgao} — ${c.cargo ?? c.nome}`}>
                  {c.orgao} — {c.cargo ?? c.nome}
                </div>
                <div className={cn("truncate text-xs", c.id === concursoAtivoId ? "text-sidebar-primary-foreground" : "text-[var(--sidebar-muted)]")} title={c.nome}>{c.nome}</div>
              </div>
              {c.id === concursoAtivoId ? (
                <Check className="ml-auto h-4 w-4 shrink-0 text-sidebar-primary-foreground" aria-hidden />
              ) : null}
            </button>
          ))
        )}
      </div>
      <div className="border-t border-sidebar-border p-2">
        <button
          ref={manageRef}
          type="button"
          className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground focus-visible:ring-inset"
          onClick={() => {
            setOpen(false);
            navigate("/concursos");
            onAfterPick?.();
          }}
        >
          + Gerenciar concursos
        </button>
      </div>
    </PopoverContent>
  ) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}><div
      className={cn("relative shrink-0", collapsed && !mobileOpen ? "flex justify-center px-0 pt-3" : "mx-3 mt-3")}
      ref={rootRef}
    >
      <PopoverAnchor asChild>{collapsed && !mobileOpen ? triggerCollapsed : triggerExpanded}</PopoverAnchor>
      {panel}
    </div></Popover>
  );
}
