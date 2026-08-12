import { cn } from "@/lib/utils";

type HandDrawnAccentVariant = "arrow" | "circle" | "swoop" | "underline" | "wave";

type HandDrawnAccentProps = {
  variant: HandDrawnAccentVariant;
  className?: string;
};

export function HandDrawnAccent({ variant, className }: HandDrawnAccentProps) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      className={cn("pointer-events-none overflow-visible", className)}
      viewBox="0 0 360 110"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      {variant === "swoop" && (
        <>
          <path
            d="M7 103C27 65 63 37 107 22C164 3 233 8 289 30C319 42 341 57 354 73C357 77 356 79 353 81C350 82 347 80 344 77C327 59 305 47 284 39C230 18 166 13 109 29C67 42 36 71 18 105C15 110 4 109 7 103Z"
            fill="currentColor"
          />
          <path {...commonProps} d="M17 99C37 66 69 43 108 30" strokeWidth="1.8" opacity="0.38" />
          <path {...commonProps} d="M298 37C319 47 336 59 349 74" strokeWidth="1.5" opacity="0.32" />
        </>
      )}

      {variant === "underline" && (
        <>
          <path {...commonProps} d="M12 48C82 34 169 37 348 48" strokeWidth="7" />
          <path {...commonProps} d="M33 75C111 65 213 67 323 77" strokeWidth="4" opacity="0.55" />
        </>
      )}

      {variant === "circle" && (
        <>
          <path
            {...commonProps}
            d="M347 59C339 91 267 106 170 102C74 99 14 79 17 50C20 18 100 4 197 9C293 13 356 31 347 59Z"
            strokeWidth="6"
          />
          <path {...commonProps} d="M326 82C291 103 207 109 126 98" strokeWidth="3" opacity="0.5" />
        </>
      )}

      {variant === "arrow" && (
        <>
          <path {...commonProps} d="M19 22C91 8 170 18 224 48C250 63 270 77 302 84" strokeWidth="7" />
          <path {...commonProps} d="M270 58L306 85L269 101" strokeWidth="7" />
        </>
      )}

      {variant === "wave" && (
        <path
          {...commonProps}
          d="M9 61C35 31 61 91 88 61C115 31 141 91 168 61C195 31 221 91 248 61C275 31 301 91 351 50"
          strokeWidth="7"
        />
      )}
    </svg>
  );
}
