import clsx from "clsx";

interface FireInclusionToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  /** What including it means here, e.g. "Funds retirement". */
  includedHint: string;
  /** What excluding it means here, e.g. "Net worth only". */
  excludedHint: string;
  tone?: "accent" | "loss";
}

/**
 * Whether a holding or debt belongs to the pot that funds retirement.
 *
 * Presented as a pair of labelled choices rather than a switch because the
 * excluded case needs its own explanation — "off" alone reads as a mistake.
 */
export function FireInclusionToggle({
  value,
  onChange,
  includedHint,
  excludedHint,
  tone = "accent",
}: FireInclusionToggleProps) {
  const options = [
    { selected: true, label: "Counts toward FIRE", hint: includedHint },
    { selected: false, label: "Net worth only", hint: excludedHint },
  ];

  return (
    <div>
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        FIRE target
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={String(option.selected)}
            aria-pressed={value === option.selected}
            className={clsx(
              "rounded-lg border px-3 py-2 text-left text-xs transition",
              value === option.selected
                ? tone === "loss"
                  ? "border-loss/40 bg-loss/10 text-white"
                  : "border-accent/40 bg-accent/10 text-white"
                : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
            )}
            type="button"
            onClick={() => onChange(option.selected)}
          >
            <div className="font-semibold">{option.label}</div>
            <div className="mt-0.5 text-[10px] text-ink-400">{option.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
