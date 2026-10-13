import { Link } from "react-router-dom";

import markSrc from "@/assets/brand/clickedital-icon.webp";
import logoSrc from "@/assets/brand/clickedital-logo.webp";
import { cn } from "@/lib/utils";

export type ClickEditalLogoSize = "sm" | "md" | "lg" | "hero";

type ClickEditalLogoProps = {
  className?: string;
  size?: ClickEditalLogoSize;
  /** Só o mark (ex.: sidebar colapsada) */
  markOnly?: boolean;
  /** Fundo claro de apoio para preservar o logo original em superfícies escuras. */
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

const LOGO_WIDTH: Record<ClickEditalLogoSize, string> = {
  sm: "w-36", md: "w-40 sm:w-44", lg: "w-48 sm:w-52", hero: "w-72 sm:w-80 lg:w-96",
};

/**
 * Marca completa fornecida pelo usuário, sem wordmark recriado em texto.
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
  const priorityProps = fetchPriority ? { fetchpriority: fetchPriority } : {};

  const inner = <img
    src={markOnly ? markSrc : logoSrc}
    alt="" aria-hidden
    width={markOnly ? mark.w : 960} height={markOnly ? mark.w : 188}
    className={cn("shrink-0 object-contain", markOnly ? mark.className : ["h-auto max-w-full", LOGO_WIDTH[size]])}
    decoding="async" {...priorityProps}
  />;

  const classes = cn(
    "inline-flex max-w-full shrink-0 items-center rounded-lg",
    !markOnly && (inverse ? "bg-white p-2" : "dark:bg-white dark:p-2"),
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
