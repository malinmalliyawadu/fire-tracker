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
  tone?: "accent" | "loss";
}

const COL_CLASS: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

const TONE_ACTIVE: Record<
  NonNullable<ChoiceCardsProps<string>["tone"]>,
  string
> = {
  accent: "border-accent/40 bg-accent/10 text-white",
  loss: "border-loss/40 bg-loss/10 text-white",
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
  tone = "accent",
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
              "rounded-xl border px-3 py-2.5 text-left text-xs transition",
              active
                ? TONE_ACTIVE[tone]
                : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
            )}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <div className="font-semibold leading-tight">{option.label}</div>
            {option.hint && (
              <div className="mt-1 text-[10px] leading-snug text-ink-400">
                {option.hint}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
