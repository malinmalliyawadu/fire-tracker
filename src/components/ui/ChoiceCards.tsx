import clsx from "clsx";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface ChoiceCardsProps<T extends string> {
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T;
  onChange: (value: T) => void;
  cols?: 2 | 3;
}

const COL_CLASS: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

/**
 * A row of mutually exclusive choices, each with a line of explanation.
 *
 * Used where a switch would be ambiguous: both states need a caption, because
 * "off" on its own reads as a mistake rather than a decision.
 */
export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
}: ChoiceCardsProps<T>) {
  return (
    <div className={clsx("grid gap-2", COL_CLASS[cols])}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            aria-pressed={active}
            className={clsx(
              "press rounded-lg border px-3.5 py-3 text-left transition-colors duration-[var(--dur-hover)]",
              active
                ? "border-ink bg-ink text-on-ink"
                : "border-line bg-transparent text-ink hover:border-ink-3",
            )}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <div className="text-[13.5px] font-medium leading-tight">
              {option.label}
            </div>
            {option.hint && (
              <div
                className={clsx(
                  "mt-1 text-[12px] leading-snug",
                  active ? "text-on-ink/70" : "text-ink-3",
                )}
              >
                {option.hint}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
