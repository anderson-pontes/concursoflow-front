import React from "react";
import { Calendar, X } from "lucide-react";
import { toast } from "sonner";

import { CreatableSelect } from "@/components/concursos/CreatableSelect";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type PlanoModalFormData = {
  nome: string;
  orgao: string;
  cargo: string;
  banca?: string;
  status: "ativo" | "pausado" | "encerrado";
  data_prova?: string;
  ativo: boolean;
};

const defaults: PlanoModalFormData = {
  nome: "",
  orgao: "",
  cargo: "",
  banca: "",
  status: "ativo",
  data_prova: "",
  ativo: true,
};

const statusOptions: { value: PlanoModalFormData["status"]; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "encerrado", label: "Encerrado" },
];

const switchLabelId = "plano-modal-ativo-label";

export function ModalCriarPlano({
  open,
  onClose,
  initialValues,
  onSubmit,
  title,
  submitText,
  orgaoSuggestions,
  cargoSuggestions,
  bancaSuggestions,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<PlanoModalFormData>;
  onSubmit: (values: PlanoModalFormData) => Promise<void> | void;
  title: string;
  submitText: string;
  orgaoSuggestions: string[];
  cargoSuggestions: string[];
  bancaSuggestions: string[];
}) {
  const [values, setValues] = React.useState<PlanoModalFormData>({ ...defaults, ...initialValues });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues({ ...defaults, ...initialValues });
    }
  }, [open, initialValues]);

  if (!open) return null;

  const validate = (): boolean => {
    if (values.nome.trim().length < 3) {
      toast.error("Informe o nome do plano (mínimo 3 caracteres).");
      return false;
    }
    if (values.orgao.trim().length < 2) {
      toast.error("Informe o órgão (mínimo 2 caracteres).");
      return false;
    }
    if (values.cargo.trim().length < 2) {
      toast.error("Informe o cargo (mínimo 2 caracteres).");
      return false;
    }
    return true;
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-plano-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
          "dark:border-neutral-700 dark:bg-neutral-950",
        )}
      >
        <div className="relative border-b border-slate-100 px-6 pb-4 pt-6 pr-14 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 id="modal-plano-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-neutral-50">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Preencha os dados do plano de estudo</p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validate()) return;
            setSubmitting(true);
            try {
              await onSubmit(values);
              onClose();
            } catch {
              /* toast opcional no pai */
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="sm:col-span-2">
                <label
                  htmlFor="plano-nome"
                  className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400"
                >
                  Nome do plano <span className="text-primary-600 dark:text-primary-400">*</span>
                </label>
                <input
                  id="plano-nome"
                  required
                  value={values.nome}
                  onChange={(e) => setValues((s) => ({ ...s, nome: e.target.value }))}
                  className={cn(
                    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
                    "placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                    "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
                  )}
                  placeholder="Ex.: CGU 2025 — reta final"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CreatableSelect
                  id="plano-orgao"
                  label="Órgão"
                  required
                  value={values.orgao}
                  onChange={(v) => setValues((s) => ({ ...s, orgao: v }))}
                  suggestions={orgaoSuggestions}
                  placeholder="Ex.: CGU, TCU…"
                  disabled={submitting}
                />
                <CreatableSelect
                  id="plano-cargo"
                  label="Cargo"
                  required
                  value={values.cargo}
                  onChange={(v) => setValues((s) => ({ ...s, cargo: v }))}
                  suggestions={cargoSuggestions}
                  placeholder="Ex.: Analista, Auditor…"
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CreatableSelect
                  id="plano-banca"
                  label="Banca"
                  optional
                  value={values.banca ?? ""}
                  onChange={(v) => setValues((s) => ({ ...s, banca: v }))}
                  suggestions={bancaSuggestions}
                  placeholder="Ex.: Cespe, FGV…"
                  disabled={submitting}
                />
                <div>
                  <label
                    htmlFor="plano-status"
                    className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="plano-status"
                      value={values.status}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, status: e.target.value as PlanoModalFormData["status"] }))
                      }
                      disabled={submitting}
                      className={cn(
                        "h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 shadow-sm outline-none transition",
                        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                        "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-primary-400",
                      )}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                <div>
                  <label
                    htmlFor="plano-data-prova"
                    className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400"
                  >
                    Data prevista da prova
                  </label>
                  <div className="relative">
                    <input
                      id="plano-data-prova"
                      type="date"
                      value={values.data_prova ?? ""}
                      onChange={(e) => setValues((s) => ({ ...s, data_prova: e.target.value }))}
                      disabled={submitting}
                      className={cn(
                        "relative h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition",
                        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                        "[color-scheme:light] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:[color-scheme:dark]",
                        /* Um único ícone: esconde o calendário nativo (Chrome/Edge/Safari) mas mantém a área clicável */
                        "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                      )}
                    />
                    <Calendar
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
                      aria-hidden
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <div className="flex gap-3">
                    <Switch
                      id="plano-ativo"
                      checked={values.ativo}
                      onCheckedChange={(ativo) => setValues((s) => ({ ...s, ativo }))}
                      disabled={submitting}
                      aria-labelledby={switchLabelId}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        id={switchLabelId}
                        className="text-sm font-medium text-slate-800 dark:text-neutral-100"
                      >
                        Ativar no dashboard?
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
                        Ao ativar, o dashboard exibirá os dados deste plano.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                "rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition",
                "hover:bg-slate-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500/30",
                "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                "disabled:opacity-50",
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition",
                "hover:bg-primary-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950",
              )}
            >
              {submitting ? "Salvando…" : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
