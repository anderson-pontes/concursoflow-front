import { ClickEditalLogo } from "@/components/branding/ClickEditalLogo";

type LandingLogoProps = {
  className?: string;
  size?: "header" | "hero";
  /** Quando false, renderiza marca sem link (hero) */
  asLink?: boolean;
};

/**
 * Marca Click Edital na landing — delega ao componente compartilhado.
 */
export function LandingLogo({ className, size = "header", asLink = true }: LandingLogoProps) {
  return (
    <ClickEditalLogo
      className={className}
      size={size === "hero" ? "hero" : "md"}
      asLink={asLink}
    />
  );
}
