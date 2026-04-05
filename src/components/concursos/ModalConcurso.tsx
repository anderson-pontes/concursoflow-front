import React from "react";
import { FileText, ImageIcon } from "lucide-react";

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

function isEncerradoStatus(s: string | null) {
  return s === "realizado" || s === "eliminado";
}

function FloatingInput({
  id,
  label,
  value,
  onChange,
  required,
  optional,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder=" "
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "peer h-14 w-full rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white px-4 pb-2.5 pt-5 text-sm text-[#1A1A2E] outline-none transition",
          "placeholder:text-transparent focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-1/2 text-sm text-[#9CA3AF] transition-all duration-200",
          "peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[#6C3FC5]",
          "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium",
        )}
      >
        {label}
        {required ? <span className="text-[#EF4444]"> *</span> : null}
        {optional ? <span className="font-normal text-[#9CA3AF]"> (opcional)</span> : null}
      </label>
    </div>
  );
}

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
  const encerradoTab = isEncerradoStatus(input.status);

  const modalShadow = "0 24px 64px rgba(0,0,0,0.18)";

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-concurso-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden bg-white",
          "max-sm:min-h-[100dvh] max-sm:rounded-none sm:max-h-[92vh] sm:rounded-[20px]",
        )}
        style={{ boxShadow: modalShadow }}
      >
        <header className="relative shrink-0 border-b border-[#F3F4F6] px-6 pb-4 pt-6 pr-14">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-2xl leading-none text-[#9CA3AF] transition-colors duration-200 hover:bg-[#F9FAFB] hover:text-[#1A1A2E]"
            aria-label="Fechar"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none" aria-hidden>
              🏆
            </span>
            <div>
              <h2 id="modal-concurso-title" className="text-[20px] font-bold text-[#1A1A2E]">
                {isEdit ? "Editar concurso" : "Novo concurso"}
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">Preencha os dados do concurso que você está preparando</p>
            </div>
          </div>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
            <div className="space-y-8">
              <section>
                <p className="mb-4 text-[12px] font-medium uppercase tracking-[1px] text-[#9CA3AF]">📋 Identificação</p>
                <div className="space-y-4">
                  <FloatingInput
                    id="concurso-nome"
                    label="Nome do concurso"
                    required
                    value={input.nome}
                    disabled={isPending}
                    onChange={(v) => setInput((s) => ({ ...s, nome: v }))}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <CreatableSelect
                      id="concurso-orgao"
                      label="Órgão"
                      required
                      appearance="aprov"
                      value={input.orgao}
                      onChange={(v) => setInput((s) => ({ ...s, orgao: v }))}
                      suggestions={orgaoSuggestions}
                      placeholder="Ex.: CGU, SEFAZ…"
                      disabled={isPending}
                    />
                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Status</span>
                      <div className="flex rounded-[10px] bg-[#F3F4F6] p-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setInput((s) => ({ ...s, status: "ativo" }))}
                          className={cn(
                            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                            !encerradoTab
                              ? "bg-white text-[#6C3FC5] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                              : "bg-transparent text-[#6B7280]",
                          )}
                        >
                          Ativo
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setInput((s) => ({ ...s, status: "realizado" }))}
                          className={cn(
                            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                            encerradoTab
                              ? "bg-white text-[#6C3FC5] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                              : "bg-transparent text-[#6B7280]",
                          )}
                        >
                          Encerrado
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FloatingInput
                      id="concurso-cargo"
                      label="Cargo"
                      optional
                      value={input.cargo ?? ""}
                      disabled={isPending}
                      onChange={(v) => setInput((s) => ({ ...s, cargo: v || null }))}
                    />
                    <CreatableSelect
                      id="concurso-banca"
                      label="Banca"
                      optional
                      appearance="aprov"
                      value={input.banca ?? ""}
                      onChange={(v) => setInput((s) => ({ ...s, banca: v || null }))}
                      suggestions={bancaSuggestions}
                      placeholder="Ex.: Cespe, FGV…"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-4 text-[12px] font-medium uppercase tracking-[1px] text-[#9CA3AF]">📎 Documentos (opcional)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FileDropZone
                      id="concurso-logo"
                      label=""
                      description="Logo do órgão"
                      hint="PNG, JPG até 2MB"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                      file={input.logo_file}
                      onFileChange={(f) => setInput((s) => ({ ...s, logo_file: f }))}
                      icon={ImageIcon}
                      disabled={isPending}
                      variant="aprov"
                      leading="🖼️"
                    />
                    {isEdit && editing?.logo_url && !input.logo_file ? (
                      <p className="mt-2 text-xs text-[#9CA3AF]">Logo atual mantida. Envie um novo arquivo para substituir.</p>
                    ) : null}
                  </div>
                  <div>
                    <FileDropZone
                      id="concurso-edital"
                      label=""
                      description="Edital em PDF"
                      hint="PDF até 50MB"
                      accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      file={input.edital_file}
                      onFileChange={(f) => setInput((s) => ({ ...s, edital_file: f }))}
                      icon={FileText}
                      disabled={isPending}
                      variant="aprov"
                      leading="📄"
                    />
                    {isEdit && editing?.edital_url && !input.edital_file ? (
                      <p className="mt-2 text-xs text-[#9CA3AF]">Edital atual mantido. Envie um novo arquivo para substituir.</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] bg-white px-7 py-4">
            <p className="text-xs text-[#9CA3AF]">* Campos obrigatórios</p>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors duration-200 hover:bg-[#F9FAFB]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || !input.nome.trim() || !input.orgao.trim()}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8] disabled:pointer-events-none disabled:opacity-50"
              >
                {isPending ? "Salvando…" : isEdit ? (
                  <>
                    Salvar alterações <span aria-hidden>✓</span>
                  </>
                ) : (
                  <>
                    Criar concurso <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
