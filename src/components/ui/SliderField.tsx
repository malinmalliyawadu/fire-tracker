import clsx from "clsx";
import { useId } from "react";

import { FIELD_LABEL_CLASS } from "@/components/ui/Field";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  display?: string;
  hint?: string;
  className?: string;
}

/**
 * A labelled range with the current value beside the label.
 *
 * The track is drawn by hand so it can show the filled portion; the native
 * input sits on top, transparent, and keeps the keyboard behaviour.
 */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
  className,
}: SliderFieldProps) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label className={FIELD_LABEL_CLASS} htmlFor={id}>
          {label}
        </label>
        <span className="num text-[15px] font-medium text-ink">
          {display ?? value}
        </span>
      </div>
      <div className="relative h-7">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-wash-strong" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink"
          style={{ width: `${pct}%` }}
        />
        <input
          className="absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:outline [&:focus-visible::-webkit-slider-thumb]:outline-2 [&:focus-visible::-webkit-slider-thumb]:outline-offset-2 [&:focus-visible::-webkit-slider-thumb]:outline-ink"
          id={id}
          max={max}
          min={min}
          step={step}
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      {hint && <p className="text-[12.5px] text-ink-3">{hint}</p>}
    </div>
  );
}
