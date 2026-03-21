import React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type CreatableSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  optional?: boolean;
  /** Exibe asterisco de campo obrigatório (cor primária). */
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

export function CreatableSelect({
  id,
  label,
  value,
  onChange,
  suggestions,
  optional,
  required,
  placeholder = "Digite ou selecione…",
  disabled,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = suggestions.filter((s) => s.toLowerCase().includes(q));
    const uniq = Array.from(new Set(list));
    return uniq.slice(0, 8);
  }, [suggestions, value]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-neutral-400">
        {label}
        {required ? (
          <span className="ml-0.5 text-primary-600 dark:text-primary-400" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? <span className="font-normal text-slate-400"> (opcional)</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition",
            "placeholder:text-slate-400",
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
          )}
        />
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
          aria-hidden
        />
      </div>
      {open && filtered.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900"
        >
          {filtered.map((s) => (
            <li key={s} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-neutral-100 dark:hover:bg-neutral-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
