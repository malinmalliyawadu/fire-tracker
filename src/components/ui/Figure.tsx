import type { ReactNode } from "react";

import clsx from "clsx";

export type Tone = "default" | "muted" | "gain" | "loss" | "flame" | "note";

export const TONE_TEXT: Record<Tone, string> = {
  default: "text-ink",
  muted: "text-ink-2",
  gain: "text-gain",
  loss: "text-loss",
  flame: "text-flame-ink",
  note: "text-note",
};

interface FigureProps {
  label: ReactNode;
  value: ReactNode;
  /** A line of context under the value. */
  hint?: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "end";
  className?: string;
}

const SIZE: Record<NonNullable<FigureProps["size"]>, string> = {
  sm: "text-[17px] font-medium",
  md: "text-[22px] font-medium",
  lg: "display text-[32px]",
  xl: "display text-[44px]",
};

/**
 * A labelled number. The label is a sentence-case phrase in the muted ink,
 * never a tracked capital; the number carries the weight.
 */
export function Figure({
  label,
  value,
  hint,
  tone = "default",
  size = "md",
  align = "start",
  className,
}: FigureProps) {
  return (
    <div className={clsx(align === "end" && "text-right", className)}>
      <div className="text-[13px] leading-snug text-ink-3">{label}</div>
      <div
        className={clsx("num mt-1 tracking-tight", SIZE[size], TONE_TEXT[tone])}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[12.5px] leading-snug text-ink-3">{hint}</div>
      )}
    </div>
  );
}

interface FigureRowProps {
  children: ReactNode;
  className?: string;
  /** Number of columns on wide screens. */
  cols?: 2 | 3 | 4 | 5;
}

// Two columns on a phone, with a rule between the pair; from the breakpoint
// where every figure sits on one row, a rule between each neighbour.
const PAIRED =
  "[&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-line-soft [&>*:nth-child(even)]:pl-5";
const COLS: Record<NonNullable<FigureRowProps["cols"]>, string> = {
  2: `grid-cols-2 ${PAIRED}`,
  3: `grid-cols-2 sm:grid-cols-3 ${PAIRED} sm:[&>*+*]:border-l sm:[&>*+*]:border-line-soft sm:[&>*+*]:pl-6`,
  4: `grid-cols-2 lg:grid-cols-4 ${PAIRED} lg:[&>*+*]:border-l lg:[&>*+*]:border-line-soft lg:[&>*+*]:pl-6`,
  5: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ${PAIRED} sm:[&>*+*]:border-l sm:[&>*+*]:border-line-soft sm:[&>*+*]:pl-6`,
};

/** A row of figures separated by hairlines, like the foot of a ledger. */
export function FigureRow({ children, className, cols = 4 }: FigureRowProps) {
  return (
    <div
      className={clsx(
        "grid gap-x-5 gap-y-6 [&>*]:min-w-0",
        COLS[cols],
        className,
      )}
    >
      {children}
    </div>
  );
}
