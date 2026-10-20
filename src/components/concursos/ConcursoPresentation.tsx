import { useLayoutEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isEncerradoStatus } from "@/lib/concursos/utils";
import "@/components/concursos/concursos.css";

export function ConcursoTitle({ children, className, lines = 3 }: { children: string; className?: string; lines?: 2 | 3 }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  useLayoutEffect(() => {
    let mounted = true;
    const measure = () => {
      if (!mounted) return;
      const node = textRef.current;
      const clipped = !!node && node.scrollHeight > node.clientHeight + 1;
      setTruncated(clipped);
      if (!clipped) setTooltipOpen(false);
    };
    measure();
    void document.fonts?.ready.then(measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (textRef.current) observer?.observe(textRef.current);
    window.addEventListener("resize", measure);
    return () => { mounted = false; observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [children, lines]);
  return <TooltipProvider><Tooltip open={truncated && tooltipOpen} onOpenChange={open => setTooltipOpen(truncated && open)}><TooltipTrigger asChild>
    <span tabIndex={truncated ? 0 : undefined} className={cn("block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", truncated && "cursor-help", className)}>
      <span ref={textRef} className={cn(lines === 2 ? "line-clamp-2" : "line-clamp-3", "[overflow-wrap:anywhere]")}>{children}</span>
    </span>
  </TooltipTrigger><TooltipContent className="z-[10100] max-w-[min(24rem,calc(100vw-32px))] whitespace-normal leading-relaxed [overflow-wrap:anywhere]">{children}</TooltipContent></Tooltip></TooltipProvider>;
}
export function ConcursoStatus({ status }: { status: string }) {
  const closed = isEncerradoStatus(status), suspended = status === "suspenso";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", closed ? "bg-muted text-foreground" : suspended ? "bg-warning/10 text-warning-foreground" : "bg-success/10 text-success-text")}>{closed ? "Encerrado" : suspended ? "Suspenso" : "Ativo"}</span>;
}
