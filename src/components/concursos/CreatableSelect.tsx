import React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { useListboxNavigation } from "@/hooks/useListboxNavigation";

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
  /** Estilo da página Concursos (design system Aprovingo). */
  appearance?: "default" | "aprov";
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
  appearance = "default",
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

  const listboxOpen = open && filtered.length > 0;
  const { activeIndex, setActiveIndex, onKeyDown, getOptionId, listboxId, activeId } =
    useListboxNavigation({
      itemCount: filtered.length,
      isOpen: listboxOpen,
      onSelect: (index) => {
        onChange(filtered[index]);
        setOpen(false);
      },
      onClose: () => setOpen(false),
      idPrefix: id,
    });

  const isAprov = appearance === "aprov";

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-medium",
          isAprov ? "text-muted-foreground" : "text-slate-600 dark:text-neutral-400",
        )}
      >
        {label}
        {required ? (
          <span
            className={cn("ml-0.5", isAprov ? "text-primary" : "text-primary-600 dark:text-primary-400")}
            aria-hidden
          >
            *
          </span>
        ) : null}
        {optional ? (
          <span className={cn("font-normal", isAprov ? "text-muted-foreground" : "text-slate-400")}> (opcional)</span>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={listboxOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-11 w-full rounded-[10px] border-[1.5px] bg-white px-4 py-2 pr-9 text-sm outline-none transition",
            isAprov
              ? cn(
                  "border-border bg-[var(--bg-surface)] text-foreground placeholder:text-muted-foreground",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                )
              : cn(
                  "border border-slate-200 bg-white text-slate-900 shadow-sm",
                  "placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                  "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
                ),
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2",
            isAprov ? "text-muted-foreground" : "text-slate-400 dark:text-neutral-500",
          )}
          aria-hidden
        />
      </div>
      {listboxOpen ? (
        <ul
          role="listbox"
          id={listboxId}
          className={cn(
            "absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-[10px] border py-1 shadow-lg",
            isAprov ? "border-border bg-white" : "rounded-lg border-slate-200 bg-white dark:border-neutral-600 dark:bg-neutral-900",
          )}
        >
          {filtered.map((s, index) => (
            <li
              key={s}
              role="option"
              id={getOptionId(index)}
              aria-selected={activeIndex === index}
            >
              <button
                type="button"
                tabIndex={-1}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  isAprov
                    ? "text-foreground hover:bg-primary-muted"
                    : "text-slate-800 hover:bg-slate-50 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  activeIndex === index && (isAprov ? "bg-primary-muted" : "bg-slate-100 dark:bg-neutral-800"),
                )}
                onMouseEnter={() => setActiveIndex(index)}
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
