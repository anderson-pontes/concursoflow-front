import React from "react";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function CatalogLogo({
  src,
  orgao,
  size = "md",
}: {
  src: string | null;
  orgao: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const dimensions = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : size === "xl" ? "h-20 w-20" : "h-12 w-12";
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm", dimensions)}>
      {src && !failed ? (
        <img src={src} alt={`Logo do órgão ${orgao}`} className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <Building2 className="h-1/2 w-1/2 text-primary" aria-hidden />
      )}
    </span>
  );
}
