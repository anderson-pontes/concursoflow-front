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
            d="M7 103C25 67 62 38 106 22C164 2 234 8 290 31C320 43 341 58 354 74C357 78 356 81 352 83C349 85 346 82 343 79C325 61 304 49 284 41C230 20 166 15 110 31C69 45 38 72 19 105C16 110 4 110 7 103Z"
            fill="currentColor"
          />
          <path {...commonProps} d="M17 98C36 66 69 42 109 28" strokeWidth="2.5" opacity="0.5" />
          <path {...commonProps} d="M296 37C318 47 336 59 349 75" strokeWidth="2" opacity="0.45" />
          <path {...commonProps} d="M24 108C45 77 73 55 105 42" strokeWidth="2" opacity="0.35" />
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
