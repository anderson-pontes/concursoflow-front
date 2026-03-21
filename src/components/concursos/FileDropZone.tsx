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
}: FileDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const pickFiles = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    onFileChange(f);
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400">
        {label}
      </label>
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
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
          "border-slate-200 bg-slate-50/80 hover:border-primary-300 hover:bg-slate-100/90",
          dragOver && "border-primary-500 bg-primary-50/60 dark:bg-primary-950/30",
          "dark:border-neutral-600 dark:bg-neutral-900/40 dark:hover:border-primary-500/50 dark:hover:bg-neutral-800/60",
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-800 dark:ring-neutral-600">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-neutral-100">{description}</p>
          {file ? (
            <p className="mt-1 truncate text-xs text-primary-700 dark:text-primary-300" title={file.name}>
              {file.name}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Clique para buscar ou arraste o arquivo</p>
          )}
        </div>
        {file ? (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
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
