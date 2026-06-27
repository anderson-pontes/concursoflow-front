import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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
  onAfterPick?: () => void;
};

export function ConcursoSwitcher({ collapsed = false, onAfterPick }: ConcursoSwitcherProps) {
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

  const displayName = ativo ? `${ativo.orgao} — ${ativo.cargo ?? ativo.nome}` : "Selecionar concurso";

  const triggerCollapsed = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      title={displayName}
      className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] text-base transition-[border-color,background-color] duration-200 ease-out hover:border-[#6C3FC5]"
      onClick={() => setOpen((v) => !v)}
    >
      <span aria-hidden>🏆</span>
    </button>
  );

  const triggerExpanded = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--concurso-border)] bg-[var(--concurso-bg)] px-3 py-2.5 text-left transition-[border-color,background-color] duration-200 ease-out hover:border-[#6C3FC5]"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE] text-base dark:bg-[#2D2540]">
        🏆
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
        "absolute z-[130] rounded-xl border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-600 dark:bg-neutral-900",
        collapsed ? "left-full top-0 ml-2 w-[260px]" : "left-0 right-0 mt-2",
      )}
    >
      <div className="px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">Concurso ativo</div>
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {concursos.length === 0 ? (
          <p className="px-3 py-2 text-xs text-neutral-500">Nenhum concurso cadastrado.</p>
        ) : (
          concursos.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => {
                setConcursoAtivoId(c.id);
                setOpen(false);
                toast.success(`Concurso ativo: ${c.orgao}`);
                onAfterPick?.();
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {c.orgao} — {c.cargo ?? c.nome}
                </div>
                <div className="truncate text-xs text-neutral-400">{c.nome}</div>
              </div>
              {c.id === concursoAtivoId ? (
                <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#6C3FC5]" aria-hidden />
              ) : null}
            </button>
          ))
        )}
      </div>
      <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#6C3FC5] hover:bg-[#F3F0FF] dark:text-[#A78BFA] dark:hover:bg-[#1E1A2E]"
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
    <div className={cn("relative shrink-0", collapsed ? "flex justify-center px-0 pt-3" : "mx-3 mt-3")} ref={rootRef}>
      {collapsed ? triggerCollapsed : triggerExpanded}
      {panel}
    </div>
  );
}
