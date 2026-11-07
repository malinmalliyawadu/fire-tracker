import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  /** Formats the displayed value. */
  format?: (value: number) => string;
}

/** A minus / value / plus control for small whole numbers. */
export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  format = String,
}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  const button =
    "press grid h-8 w-8 place-items-center rounded-md border border-line text-ink-2 transition-colors duration-[var(--dur-hover)] hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2";

  return (
    <div
      aria-label={label}
      className="inline-flex items-center gap-1.5"
      role="group"
    >
      <button
        aria-label={`Decrease ${label}`}
        className={button}
        disabled={value <= min}
        type="button"
        onClick={dec}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span className="num min-w-[3ch] text-center text-[15px] font-medium text-ink">
        {format(value)}
      </span>
      <button
        aria-label={`Increase ${label}`}
        className={button}
        disabled={value >= max}
        type="button"
        onClick={inc}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
