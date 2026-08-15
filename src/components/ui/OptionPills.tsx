import clsx from "clsx";

interface OptionPillsProps<T> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

/** A wrapping row of small, mutually exclusive pills. */
export function OptionPills<T>({
  options,
  value,
  onChange,
}: OptionPillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option, index) => {
        const active = option.value === value;

        return (
          <button
            key={index}
            aria-pressed={active}
            className={clsx(
              "rounded-lg border px-2.5 py-1 text-xs transition",
              active
                ? "border-accent/40 bg-accent/10 text-white"
                : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
            )}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
