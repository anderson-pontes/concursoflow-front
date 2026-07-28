import { Link } from "react-router-dom";

import markSrc from "@/assets/brand/click-edital-mark.svg";
import { cn } from "@/lib/utils";

export type ClickEditalLogoSize = "sm" | "md" | "lg" | "hero";

type ClickEditalLogoProps = {
  className?: string;
  size?: ClickEditalLogoSize;
  /** Só o mark (ex.: sidebar colapsada) */
  markOnly?: boolean;
  /**
   * `inverse`: wordmark branco + mark colorido (não usar brightness invert —
   * isso achata o SVG e parece logo quebrada).
   */
  variant?: "default" | "inverse";
  /** Quando false, sem link (hero landing, auth) */
  asLink?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  "aria-hidden"?: boolean;
};

const MARK_PX: Record<ClickEditalLogoSize, { w: number; className: string }> = {
  sm: { w: 28, className: "h-7 w-7" },
  md: { w: 32, className: "h-7 w-7 sm:h-8 sm:w-8" },
  lg: { w: 40, className: "h-9 w-9 sm:h-10 sm:w-10" },
  hero: { w: 56, className: "h-12 w-12 sm:h-14 sm:w-14" },
};

const WORDMARK: Record<ClickEditalLogoSize, string> = {
  sm: "text-base leading-none font-semibold tracking-tight",
  md: "text-lg leading-none font-semibold tracking-tight sm:text-xl",
  lg: "text-xl leading-none font-semibold tracking-tight sm:text-2xl",
  hero: "font-display text-3xl leading-none sm:text-4xl md:text-5xl",
};

/**
 * Marca Click Edital — mark SVG + wordmark (app + landing).
 */
export function ClickEditalLogo({
  className,
  size = "md",
  markOnly = false,
  variant = "default",
  asLink = false,
  fetchPriority,
  "aria-hidden": ariaHidden,
}: ClickEditalLogoProps) {
  const mark = MARK_PX[size];
  const inverse = variant === "inverse";

  const inner = (
    <>
      <img
        src={markSrc}
        alt=""
        aria-hidden
        width={mark.w}
        height={mark.w}
        className={cn("shrink-0 object-contain", mark.className)}
        decoding="async"
        fetchPriority={fetchPriority}
      />
      {!markOnly && (
        <span
          className={cn(
            WORDMARK[size],
            inverse ? "text-white" : "text-primary",
          )}
        >
          Click Edital
        </span>
      )}
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-2 sm:gap-2.5",
    asLink && "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  const label = "Click Edital";

  if (asLink) {
    return (
      <Link
        to="/"
        className={classes}
        aria-label={ariaHidden ? undefined : `${label} — início`}
        aria-hidden={ariaHidden}
        tabIndex={ariaHidden ? -1 : undefined}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={classes}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : label}
      aria-hidden={ariaHidden}
    >
      {inner}
    </div>
  );
}
