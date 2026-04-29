import type { ReactNode } from "react";

import clsx from "clsx";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "gain" | "loss" | "accent";
  size?: "md" | "lg";
  className?: string;
}

const TONE: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-white",
  gain: "text-gain",
  loss: "text-loss",
  accent: "text-accent",
};

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  size = "md",
  className,
}: StatProps) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
        {label}
      </div>
      <div
        className={clsx(
          "mt-1.5 font-mono tabular font-semibold tracking-tight",
          size === "lg" ? "text-3xl" : "text-xl",
          TONE[tone],
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-ink-400">{hint}</div>
      )}
    </div>
  );
}
