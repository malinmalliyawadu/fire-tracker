import clsx from "clsx";

interface ProgressProps {
  /** 0 to 1. Values above 1 are clamped. */
  value: number;
  tone?: "ink" | "flame" | "gain";
  className?: string;
  /** Height in pixels. */
  size?: 3 | 4 | 6;
}

const FILL: Record<NonNullable<ProgressProps["tone"]>, string> = {
  ink: "bg-ink",
  flame: "bg-flame",
  gain: "bg-gain",
};

/**
 * A hairline progress bar. The fill animates on change with a transform so
 * a moving slider never triggers layout.
 */
export function Progress({
  value,
  tone = "ink",
  className,
  size = 3,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      aria-hidden
      className={clsx(
        "w-full overflow-hidden rounded-full bg-wash-strong",
        className,
      )}
      style={{ height: size }}
    >
      <div
        className={clsx(
          "h-full w-full origin-left rounded-full transition-transform duration-500 ease-[var(--ease-out)]",
          FILL[tone],
        )}
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}
