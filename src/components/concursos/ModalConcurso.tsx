import React from "react";
import { FileText, ImageIcon, X } from "lucide-react";

import { CreatableSelect } from "@/components/concursos/CreatableSelect";
import { FileDropZone } from "@/components/concursos/FileDropZone";
import { cn } from "@/lib/utils";

export type ConcursoFormInput = {
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  status: string | null;
  logo_file: File | null;
  edital_file: File | null;
};

type ConcursoRow = {
  id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  logo_url: string | null;
  status: string;
};

type ModalConcursoProps = {
  open: boolean;
  onClose: () => void;
  editing: ConcursoRow | null;
  input: ConcursoFormInput;
  setInput: React.Dispatch<React.SetStateAction<ConcursoFormInput>>;
  onSubmit: () => void;
  isPending: boolean;
  orgaoSuggestions: string[];
  bancaSuggestions: string[];
};

const statusOptions: { value: string; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "suspenso", label: "Suspenso" },
  { value: "realizado", label: "Realizado" },
  { value: "eliminado", label: "Eliminado" },
];

export function ModalConcurso({
  open,
  onClose,
  editing,
  input,
  setInput,
  onSubmit,
  isPending,
  orgaoSuggestions,
  bancaSuggestions,
}: ModalConcursoProps) {
  if (!open) return null;

  const isEdit = Boolean(editing);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-concurso-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative flex max-h-[min(92vh,900px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
          "dark:border-neutral-700 dark:bg-neutral-950",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-100 px-6 pb-4 pt-6 pr-14 dark:border-neutral-800">
          <h2 id="modal-concurso-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-neutral-50">
            {isEdit ? "Editar concurso" : "Novo concurso"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Preencha os dados abaixo</p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div>
                <label htmlFor="concurso-nome" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400">
                  Nome
                </label>
                <input
                  id="concurso-nome"
                  required
                  value={input.nome}
                  onChange={(e) => setInput((s) => ({ ...s, nome: e.target.value }))}
                  className={cn(
                    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
                    "placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                    "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
                  )}
                  placeholder="Ex.: Analista — CGU 2025"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CreatableSelect
                  id="concurso-orgao"
                  label="Órgão"
                  value={input.orgao}
                  onChange={(v) => setInput((s) => ({ ...s, orgao: v }))}
                  suggestions={orgaoSuggestions}
                  placeholder="Ex.: CGU, SEFAZ…"
                />
                <div>
                  <label
                    htmlFor="concurso-status"
                    className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="concurso-status"
                      value={input.status ?? "ativo"}
                      onChange={(e) => setInput((s) => ({ ...s, status: e.target.value }))}
                      className={cn(
                        "h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition",
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="concurso-cargo" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400">
                    Cargo <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    id="concurso-cargo"
                    value={input.cargo ?? ""}
                    onChange={(e) => setInput((s) => ({ ...s, cargo: e.target.value || null }))}
                    className={cn(
                      "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
                      "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                      "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
                    )}
                    placeholder="Ex.: Analista de TI"
                  />
                </div>
                <CreatableSelect
                  id="concurso-banca"
                  label="Banca"
                  optional
                  value={input.banca ?? ""}
                  onChange={(v) => setInput((s) => ({ ...s, banca: v || null }))}
                  suggestions={bancaSuggestions}
                  placeholder="Ex.: Cespe, FGV…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FileDropZone
                    id="concurso-logo"
                    label="Upload da logo (opcional)"
                    description="Logo do órgão"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                    file={input.logo_file}
                    onFileChange={(f) => setInput((s) => ({ ...s, logo_file: f }))}
                    icon={ImageIcon}
                    disabled={isPending}
                  />
                  {isEdit && editing?.logo_url && !input.logo_file ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">
                      Logo atual mantida. Envie um novo arquivo para substituir.
                    </p>
                  ) : null}
                </div>
                <div>
                  <FileDropZone
                    id="concurso-edital"
                    label="Upload do edital (opcional)"
                    description="PDF ou documento"
                    accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    file={input.edital_file}
                    onFileChange={(f) => setInput((s) => ({ ...s, edital_file: f }))}
                    icon={FileText}
                    disabled={isPending}
                  />
                  {isEdit && editing?.edital_url && !input.edital_file ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">
                      Edital atual mantido. Envie um novo arquivo para substituir.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition",
                "hover:bg-slate-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500/30",
                "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !input.nome.trim() || !input.orgao.trim()}
              className={cn(
                "rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition",
                "hover:bg-primary-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950",
              )}
            >
              {isPending ? "Salvando…" : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
