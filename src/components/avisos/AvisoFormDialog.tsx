import React from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export type AvisoFormValues = {
  concurso_id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  data_vencimento: string;
};

export const AVISO_TIPO_OPTIONS = [
  { value: "inscricao", label: "Inscrição" },
  { value: "prova", label: "Prova" },
  { value: "resultado", label: "Resultado" },
  { value: "pagamento", label: "Pagamento" },
  { value: "outro", label: "Outro" },
] as const;

export function emptyAvisoForm(): AvisoFormValues {
  return {
    concurso_id: "",
    titulo: "",
    tipo: "inscricao",
    descricao: "",
    data_vencimento: new Date().toISOString().slice(0, 10),
  };
}

export function tipoLabel(tipo: string): string {
  const found = AVISO_TIPO_OPTIONS.find((o) => o.value === tipo);
  return found?.label ?? tipo;
}

type ConcursoOption = { id: string; nome: string };

type AvisoFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<AvisoFormValues>;
  onClose: () => void;
  onSubmit: (values: AvisoFormValues) => Promise<void>;
  isPending?: boolean;
};

export function AvisoFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isPending = false,
}: AvisoFormDialogProps) {
  const [values, setValues] = React.useState<AvisoFormValues>(emptyAvisoForm);
  const tituloRef = React.useRef<HTMLInputElement>(null);

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoOption[],
    enabled: open,
  });

  React.useEffect(() => {
    if (!open) return;
    setValues({ ...emptyAvisoForm(), ...initialValues });
    const t = window.setTimeout(() => tituloRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, mode, initialValues]);

  const tipoKnown = AVISO_TIPO_OPTIONS.some((o) => o.value === values.tipo);
  const canSubmit = Boolean(values.titulo.trim()) && Boolean(values.data_vencimento) && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      ...values,
      titulo: values.titulo.trim(),
      descricao: values.descricao.trim(),
      tipo: values.tipo.trim() || "inscricao",
    });
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
          "flex w-full max-w-[520px] flex-col gap-0 overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] p-0 font-sans shadow-xl",
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
              <Bell className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--text-primary)]">
                {mode === "create" ? "Novo aviso" : "Editar aviso"}
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Defina o prazo e o contexto do lembrete
              </p>
            </div>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="aviso-concurso"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Concurso <span className="text-[var(--text-muted)]">(opcional)</span>
                </label>
                <select
                  id="aviso-concurso"
                  disabled={isPending}
                  value={values.concurso_id}
                  onChange={(e) => setValues((s) => ({ ...s, concurso_id: e.target.value }))}
                  className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sem concurso</option>
                  {concursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="aviso-tipo"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Tipo
                </label>
                <select
                  id="aviso-tipo"
                  disabled={isPending}
                  value={values.tipo}
                  onChange={(e) => setValues((s) => ({ ...s, tipo: e.target.value }))}
                  className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {!tipoKnown && values.tipo ? (
                    <option value={values.tipo}>{values.tipo}</option>
                  ) : null}
                  {AVISO_TIPO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="aviso-titulo"
                className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Título <span className="text-red-500">*</span>
              </label>
              <input
                ref={tituloRef}
                id="aviso-titulo"
                required
                disabled={isPending}
                value={values.titulo}
                onChange={(e) => setValues((s) => ({ ...s, titulo: e.target.value }))}
                className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="aviso-data"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Data vencimento <span className="text-red-500">*</span>
                </label>
                <input
                  id="aviso-data"
                  type="date"
                  required
                  disabled={isPending}
                  value={values.data_vencimento}
                  onChange={(e) => setValues((s) => ({ ...s, data_vencimento: e.target.value }))}
                  className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="aviso-descricao"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Descrição <span className="text-[var(--text-muted)]">(opcional)</span>
                </label>
                <input
                  id="aviso-descricao"
                  disabled={isPending}
                  value={values.descricao}
                  onChange={(e) => setValues((s) => ({ ...s, descricao: e.target.value }))}
                  className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
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
                  ? "Criar aviso"
                  : "Salvar"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
