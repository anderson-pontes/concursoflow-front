import React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  "aria-labelledby": ariaLabelledBy,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent px-0.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary-600 dark:bg-primary-500" : "bg-slate-200 dark:bg-neutral-600",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-out dark:bg-neutral-100",
          checked ? "translate-x-5" : "translate-x-0",
        )}
        aria-hidden
      />
    </button>
  );
}
