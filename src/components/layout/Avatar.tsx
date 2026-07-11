import React from "react";

import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  avatarUrl: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
};

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

const sizeClass = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({ name, avatarUrl, className, size = "md" }: Props) {
  const src = resolvePublicUrl(avatarUrl ?? null);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-surface", sizeClass[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-muted font-semibold text-primary ring-2 ring-surface",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {initialsFromName(name)}
    </span>
  );
}
