import React from "react";

import { cn } from "@/lib/utils";

import logoSrc from "../../assets/logo2.svg";

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
