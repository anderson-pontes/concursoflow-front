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
        "z-[130] rounded-xl border border-border bg-surface p-2 shadow-md",
        collapsed && !mobileOpen
          ? "absolute left-full top-0 ml-2 w-[min(260px,calc(100vw-5rem))]"
          : "absolute left-0 right-0 mt-2 max-h-[min(16rem,50vh)] overflow-y-auto",
      )}
      role="listbox"
      id={listboxId}
      aria-label="Selecionar concurso"
    >
      <div className="px-2 py-1 text-xs text-muted-foreground">Concurso ativo</div>
      <div className="max-h-56 space-y-1 overflow-y-auto">
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
                "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-surface-hover",
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
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-xs font-medium text-primary hover:bg-surface-hover"
        onClick={() => {
          setOpen(false);
          navigate("/concursos");
          onAfterPick?.();
        }}
      >
        + Gerenciar concursos
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
