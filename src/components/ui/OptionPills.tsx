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
              "press num rounded-md border px-2.5 py-1 text-[13px] transition-colors duration-[var(--dur-hover)]",
              active
                ? "border-ink bg-ink text-on-ink"
                : "border-line bg-transparent text-ink-2 hover:border-ink-3 hover:text-ink",
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
