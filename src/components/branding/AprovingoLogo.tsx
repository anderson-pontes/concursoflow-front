import React from "react";

import { cn } from "@/lib/utils";

/** Runtime: WebP otimizado. Fonte: `src/assets/logo2.svg` (não importado no bundle). */
import logoSrc from "@/assets/brand/logo2.webp";

type Props = {
  className?: string;
  "aria-hidden"?: boolean;
};

export function AprovingoLogo({
  className,
  "aria-hidden": ariaHidden,
  fetchPriority,
}: Props & { fetchPriority?: "high" | "low" | "auto" }) {
  return (
    <img
      src={logoSrc}
      alt={ariaHidden ? "" : "Aprovingo"}
      aria-hidden={ariaHidden}
      className={cn("object-contain object-left", className)}
      decoding="async"
      fetchPriority={fetchPriority}
      width={220}
      height={52}
    />
  );
}
