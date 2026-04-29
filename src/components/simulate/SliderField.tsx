import clsx from "clsx";

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
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">
          {label}
        </label>
        <span className="font-mono tabular text-sm font-semibold tracking-tight">
          {display ?? value}
        </span>
      </div>
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent to-accent-soft"
          style={{ width: `${pct}%` }}
        />
        <input
          aria-label={label}
          className="slider-input relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-glow [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:transition-transform [&:focus-visible::-webkit-slider-thumb]:scale-125 [&:hover::-webkit-slider-thumb]:scale-110"
          max={max}
          min={min}
          step={step}
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      {hint && <p className="text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}
