import React from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type FileDropZoneProps = {
  id: string;
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon: LucideIcon;
  disabled?: boolean;
  /** Estilo da página Concursos (design system Aprovingo). */
  variant?: "default" | "aprov";
  /** Texto auxiliar abaixo da descrição (ex.: limites de arquivo). */
  hint?: string;
  /** Conteúdo extra acima da descrição (ex.: emoji). */
  leading?: React.ReactNode;
};

export function FileDropZone({
  id,
  label,
  description,
  accept,
  file,
  onFileChange,
  icon: Icon,
  disabled,
  variant = "default",
  hint,
  leading,
}: FileDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setImagePreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setImagePreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pickFiles = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    onFileChange(f);
  };

  const isAprov = variant === "aprov";

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 block text-xs font-medium",
            isAprov ? "text-[#6B7280]" : "text-slate-600 dark:text-neutral-400",
          )}
        >
          {label}
        </label>
      ) : null}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (disabled) return;
          pickFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed text-center transition duration-200",
          isAprov
            ? cn(
                "rounded-[12px] bg-[#FAFAFE] px-6 py-6",
                "border-[#C4B5FD] hover:border-solid hover:border-[#6C3FC5] hover:bg-[#F3F0FF]",
                dragOver && "border-solid border-[#6C3FC5] bg-[#EDE9FE]",
              )
            : cn(
                "rounded-xl px-4 py-6",
                "border-slate-200 bg-slate-50/80 hover:border-primary-300 hover:bg-slate-100/90",
                dragOver && "border-primary-500 bg-primary-50/60 dark:bg-primary-950/30",
                "dark:border-neutral-600 dark:bg-neutral-900/40 dark:hover:border-primary-500/50 dark:hover:bg-neutral-800/60",
              ),
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {leading ? (
          <span className="text-[32px] leading-none text-[#A78BFA]" aria-hidden>
            {leading}
          </span>
        ) : (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg shadow-sm",
              isAprov ? "bg-white ring-1 ring-[#E5E7EB]" : "bg-white ring-1 ring-slate-200 dark:bg-neutral-800 dark:ring-neutral-600",
            )}
          >
            <Icon
              className={cn("h-5 w-5", isAprov ? "text-[#6C3FC5]" : "text-primary-600 dark:text-primary-400")}
              aria-hidden
            />
          </div>
        )}
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isAprov ? "text-[#1A1A2E]" : "font-medium text-slate-800 dark:text-neutral-100",
            )}
          >
            {description}
          </p>
          {file ? (
            <p
              className={cn(
                "mt-1 truncate text-xs",
                isAprov ? "text-[#6C3FC5]" : "text-primary-700 dark:text-primary-300",
              )}
              title={file.name}
            >
              {file.name}
            </p>
          ) : hint ? (
            <p className={cn("mt-1 text-xs", isAprov ? "text-[#9CA3AF]" : "text-slate-500 dark:text-neutral-400")}>
              {hint}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Clique para buscar ou arraste o arquivo</p>
          )}
        </div>
        {isAprov && imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt=""
            className="mt-2 max-h-24 max-w-full rounded-lg border border-[#E5E7EB] object-contain"
          />
        ) : null}
        {file ? (
          <button
            type="button"
            className={cn(
              "absolute right-2 top-2 rounded-md p-1",
              isAprov
                ? "text-[#6B7280] hover:bg-[#F3F0FF] hover:text-[#6C3FC5]"
                : "text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
            )}
            aria-label="Remover arquivo"
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
