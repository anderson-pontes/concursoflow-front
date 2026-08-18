import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useListboxNavigation } from "@/hooks/useListboxNavigation";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

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
  const setConcursoAtivoId = useConcursoStore((s) => s.setConcursoAtivoId);

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoRow[],
  });

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ativo = concursos.find((c) => c.id === concursoAtivoId) ?? null;

  const pickConcurso = React.useCallback(
    (c: ConcursoRow) => {
      setConcursoAtivoId(c.id);
      setOpen(false);
      toast.success(`Concurso ativo: ${c.orgao}`);
      onAfterPick?.();
    },
    [setConcursoAtivoId, onAfterPick],
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
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    onListboxKeyDown(e);
  };

  React.useEffect(() => {
    if (!open) return;
    const selectedIndex = concursos.findIndex((c) => c.id === concursoAtivoId);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, concursos, concursoAtivoId, setActiveIndex]);

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
    if (!mobileOpen) setOpen(false);
  }, [mobileOpen]);

  const displayName = ativo ? `${ativo.orgao} — ${ativo.cargo ?? ativo.nome}` : "Selecionar concurso";

  const triggerClass =
    "flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const triggerCollapsed = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listboxId : undefined}
      aria-activedescendant={activeId}
      title={displayName}
      className={cn(triggerClass, "mx-auto h-11 w-11 shrink-0 justify-center px-0")}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={onTriggerKeyDown}
    >
      <span aria-hidden>🏆</span>
    </button>
  );

  const triggerExpanded = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listboxId : undefined}
      aria-activedescendant={activeId}
      className={cn(triggerClass, "w-full px-3 py-2 text-left")}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={onTriggerKeyDown}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-base">
        🏆
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Concurso ativo</div>
        <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
      </div>
      <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );

  const panel = open ? (
    <div
      className={cn(
        "z-[130] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
        collapsed && !mobileOpen
          ? "absolute left-full top-0 ml-2 w-[min(260px,calc(100vw-5rem))]"
          : "absolute left-0 right-0 mt-2",
      )}
    >
      <div className="border-b border-border px-3 py-2.5">
        <p id={`${listboxId}-label`} className="text-xs font-medium text-muted-foreground">
          Trocar concurso ativo
        </p>
      </div>
      <div
        className="max-h-[min(18rem,calc(100dvh-13rem))] space-y-1 overflow-y-auto overscroll-contain p-2"
        role="listbox"
        id={listboxId}
        aria-labelledby={`${listboxId}-label`}
      >
        {concursos.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum concurso cadastrado.</p>
        ) : (
          concursos.map((c, index) => (
            <button
              key={c.id}
              type="button"
              role="option"
              id={getOptionId(index)}
              aria-selected={c.id === concursoAtivoId}
              className={cn(
                "flex min-h-12 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                c.id === concursoAtivoId && "bg-primary-muted/70",
                index === activeIndex && "bg-surface-hover ring-2 ring-inset ring-ring",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => pickConcurso(c)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {c.orgao} — {c.cargo ?? c.nome}
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.nome}</div>
              </div>
              {c.id === concursoAtivoId ? (
                <Check className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </button>
          ))
        )}
      </div>
      <div className="border-t border-border p-2">
        <button
          type="button"
          className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary-muted"
          onClick={() => {
            setOpen(false);
            navigate("/concursos");
            onAfterPick?.();
          }}
        >
          + Gerenciar concursos
        </button>
      </div>
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
