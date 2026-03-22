import React from "react";

/** Caminho: `frontend/src/assets/logo2.svg` */
import logo2Src from "../../assets/logo2.svg";

type Props = {
  className?: string;
  "aria-hidden"?: boolean;
};

/** Logótipo a partir de `logo2.svg` (sem filtros). */
export function AprovingoLogo({ className, "aria-hidden": ariaHidden }: Props) {
  return (
    <img
      src={logo2Src}
      alt={ariaHidden ? "" : "Aprovingo"}
      aria-hidden={ariaHidden}
      className={className}
      decoding="async"
    />
  );
}
