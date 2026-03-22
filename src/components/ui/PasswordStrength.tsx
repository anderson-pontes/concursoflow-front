import React from "react";

const strongRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function scorePassword(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (strongRe.test(pw)) return 3;
  return Math.min(s, 2) as 0 | 1 | 2 | 3;
}

const labels = ["", "Fraca", "Média", "Forte"] as const;
const barColors = ["bg-neutral-200 dark:bg-neutral-700", "bg-danger-400", "bg-warning-400", "bg-success-600"];

type Props = {
  password: string;
  className?: string;
};

export function PasswordStrength({ password, className = "" }: Props) {
  const score = scorePassword(password);
  const pct = score === 0 ? 0 : (score / 3) * 100;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColors[score]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {password ? (
        <p className="text-xs text-muted-foreground">
          Força: <span className="font-medium text-foreground">{labels[score]}</span>
        </p>
      ) : null}
    </div>
  );
}
