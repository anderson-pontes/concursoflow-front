type CircularArcProps = {
  progress: number;
  size: number;
  stroke: number;
  className?: string;
};

export function CircularArc({ progress, size, stroke, className = "stroke-current" }: CircularArcProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        className="stroke-white/10"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        className={`${className} transition-[stroke-dashoffset] duration-700 ease-out`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
