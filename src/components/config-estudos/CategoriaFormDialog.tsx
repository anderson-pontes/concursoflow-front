import React from "react";
import { Tags } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CategoriaFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialNome?: string;
  onClose: () => void;
  onSubmit: (nome: string) => Promise<void>;
  isPending?: boolean;
};

export function CategoriaFormDialog({
  open,
  mode,
  initialNome = "",
  onClose,
  onSubmit,
  isPending = false,
}: CategoriaFormDialogProps) {
  const [nome, setNome] = React.useState(initialNome);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setNome(initialNome);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, mode, initialNome]);

  const canSubmit = Boolean(nome.trim()) && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit(nome.trim());
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose();
      }}
    >
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className={cn(
          "flex w-full max-w-[440px] flex-col gap-0 overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] p-0 font-sans shadow-xl",
          "max-h-[92vh] max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-h-[92vh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-[20px] sm:rounded-[20px]",
        )}
      >
        <header className="relative shrink-0 border-b border-[var(--border-subtle)] px-6 pb-4 pt-6 pr-14">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="absolute right-3 top-3 rounded-lg p-2 text-2xl leading-none text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            aria-label="Fechar"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary dark:bg-[var(--ap-brand-light)]">
              <Tags className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--text-primary)]">
                {mode === "create" ? "Nova categoria" : "Editar categoria"}
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Rótulo usado ao registrar um estudo
              </p>
            </div>
          </div>
        </header>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <label
              htmlFor="categoria-nome"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="categoria-nome"
              required
              disabled={isPending}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-[10px] border border-[var(--border-default)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending
                ? mode === "create"
                  ? "Criando…"
                  : "Salvando…"
                : mode === "create"
                  ? "Criar"
                  : "Salvar"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
