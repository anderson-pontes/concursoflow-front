import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { usePlanoStore } from "@/stores/planoStore";

export function PlanoSwitcher() {
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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-9 max-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-50 dark:hover:bg-neutral-900"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-5 w-5 overflow-hidden rounded bg-white dark:bg-neutral-800">
          {ativo?.logoUrl ? <img src={ativo.logoUrl} className="h-5 w-5 object-cover" /> : null}
        </div>
        <span className="max-w-[140px] truncate">{ativo?.nome ?? "Selecionar plano"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>

      {open ? (
        <div className="absolute right-0 z-[120] mt-2 w-[260px] rounded-xl border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-600 dark:bg-neutral-900 dark:shadow-lg">
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
                }}
              >
                <div className="h-7 w-7 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                  {p.logoUrl ? <img src={p.logoUrl} className="h-7 w-7 object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{p.nome}</div>
                  <div className="truncate text-xs text-neutral-400">{p.orgao}</div>
                </div>
                {p.id === planoAtivoId ? <Check className="ml-auto h-3.5 w-3.5 text-primary-600" /> : null}
              </button>
            ))}
          </div>

          <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
            onClick={() => {
              setOpen(false);
              navigate("/concursos/planos");
            }}
          >
            + Gerenciar planos
          </button>
        </div>
      ) : null}
    </div>
  );
}

