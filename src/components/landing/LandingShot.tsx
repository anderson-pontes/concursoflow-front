import { cn } from "@/lib/utils";

type LandingShotProps = {
  src: string;
  alt: string;
  className?: string;
  /** object-position — screenshots costumam precisar de object-top */
  position?: string;
  priority?: boolean;
};

/**
 * Frame leve para screenshots do produto — sem card pesado.
 */
export function LandingShot({
  src,
  alt,
  className,
  position = "object-top",
  priority = false,
}: LandingShotProps) {
  return (
    <figure
      className={cn(
        "relative isolate overflow-hidden rounded-xl ring-1 ring-border/60",
        "bg-surface shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-cover", position)}
        decoding={priority ? "sync" : "async"}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </figure>
  );
}
