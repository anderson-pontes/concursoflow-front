import { ClickEditalLogo, type ClickEditalLogoSize } from "@/components/branding/ClickEditalLogo";

type Props = {
  className?: string;
  "aria-hidden"?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  size?: ClickEditalLogoSize;
  markOnly?: boolean;
  variant?: "default" | "inverse";
};

/**
 * @deprecated Use `ClickEditalLogo`. Mantido como alias para imports legados.
 */
export function AprovingoLogo({
  className,
  "aria-hidden": ariaHidden,
  fetchPriority,
  size = "md",
  markOnly,
  variant = "default",
}: Props) {
  return (
    <ClickEditalLogo
      className={className}
      size={size}
      markOnly={markOnly}
      variant={variant}
      fetchPriority={fetchPriority}
      aria-hidden={ariaHidden}
    />
  );
}
