import React from "react";
import { ChevronRight, Info } from "lucide-react";

import { FLASH_CARD_SHADOW } from "@/lib/flashcards/constants";

export function FlashCfgAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      style={{ boxShadow: FLASH_CARD_SHADOW }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-sm font-bold text-[#1A1A2E] transition hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-700/50"
      >
        <span>{title}</span>
        <ChevronRight
          className={`h-5 w-5 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-8 border-t border-neutral-100 px-4 py-5 dark:border-neutral-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function FlashCfgIntRow({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  sliderMax,
  dirty,
  error,
  defaultVal,
  onChipReset,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  sliderMax?: number;
  dirty: boolean;
  error?: string;
  defaultVal: number;
  onChipReset: () => void;
}) {
  const sMax = sliderMax ?? max;
  const clampFull = (n: number) => {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.round(n)));
  };
  const sliderVal = Math.min(sMax, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        <label
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            dirty ? "text-[#6C3FC5]" : "text-[#1A1A2E] dark:text-neutral-100"
          }`}
        >
          {dirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#6C3FC5]" aria-hidden /> : null}
          {label}
        </label>
        <span className="cursor-help text-[#9CA3AF]" title={tooltip}>
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <button
          type="button"
          onClick={onChipReset}
          className="ml-auto rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-[#6C3FC5] transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:bg-violet-900/40"
        >
          Padrão Anki: {defaultVal}
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="range"
          min={min}
          max={sMax}
          value={sliderVal}
          onChange={(e) => onChange(clampFull(Number(e.target.value)))}
          className="h-2 flex-1 cursor-pointer accent-[#6C3FC5]"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : min}
          onChange={(e) => onChange(clampFull(Number(e.target.value)))}
          className={`w-full rounded-[10px] px-3 py-2.5 tabular-nums text-sm font-semibold outline-none sm:w-28 dark:bg-neutral-900 ${
            error
              ? "border-2 border-red-500"
              : dirty
                ? "border-2 border-[#6C3FC5]"
                : "border border-neutral-200 dark:border-neutral-600"
          }`}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-[#9CA3AF]">
        <span>{min}</span>
        <span>{sMax < max ? `${sMax} (slider)` : max}</span>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

export function FlashCfgFloatRow({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step,
  dirty,
  error,
  decimals,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  dirty: boolean;
  error?: string;
  decimals: number;
}) {
  const clamp = (n: number) => {
    if (!Number.isFinite(n)) return min;
    const t = 10 ** decimals;
    const r = Math.round(n * t) / t;
    return Math.min(max, Math.max(min, r));
  };
  const safe = clamp(value);
  const steps = Math.round((max - min) / step);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            dirty ? "text-[#6C3FC5]" : "text-[#1A1A2E] dark:text-neutral-100"
          }`}
        >
          {dirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#6C3FC5]" aria-hidden /> : null}
          {label}
        </label>
        <span className="cursor-help text-[#9CA3AF]" title={tooltip}>
          <Info className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="range"
          min={0}
          max={steps}
          value={Math.round((safe - min) / step)}
          onChange={(e) => onChange(clamp(min + Number(e.target.value) * step))}
          className="h-2 flex-1 cursor-pointer accent-[#6C3FC5]"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={safe}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className={`w-full rounded-[10px] px-3 py-2.5 tabular-nums text-sm font-semibold outline-none sm:w-28 dark:bg-neutral-900 ${
            error
              ? "border-2 border-red-500"
              : dirty
                ? "border-2 border-[#6C3FC5]"
                : "border border-neutral-200 dark:border-neutral-600"
          }`}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-[#9CA3AF]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
