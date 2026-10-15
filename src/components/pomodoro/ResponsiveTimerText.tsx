import React from "react";

type ResponsiveTimerTextProps = {
  value: string;
  compact?: boolean;
};

/** Keeps long HH:MM:SS values inside the circular timer without clipping them. */
export function ResponsiveTimerText({ value, compact = false }: ResponsiveTimerTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = React.useState(compact ? 30 : 88);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const available = Math.max(40, container.clientWidth - 40);
      const probe = document.createElement("canvas");
      const context = probe.getContext("2d");
      if (!context) return;
      const maxSize = compact ? 36 : 88;
      const minSize = compact ? 20 : 28;
      context.font = `900 ${maxSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      const measured = Math.max(1, context.measureText(value).width);
      setFontSize(Math.max(minSize, Math.min(maxSize, (maxSize * available) / measured)));
    };

    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [compact, value]);

  return (
    <div ref={containerRef} className="flex w-full min-w-0 items-center justify-center px-5">
      <span
        className="whitespace-nowrap font-mono font-black leading-none tracking-tight tabular-nums text-white"
        style={{ fontSize: `${fontSize}px`, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </div>
  );
}
