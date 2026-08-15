import type { ContributionFrequency } from "@/types";

import clsx from "clsx";

import { FREQUENCIES, FREQUENCY_PILL } from "@/domain/labels";

interface FrequencyPillsProps {
  value: ContributionFrequency;
  onChange: (value: ContributionFrequency) => void;
  tone?: "accent" | "loss";
}

const TONE_ACTIVE: Record<NonNullable<FrequencyPillsProps["tone"]>, string> = {
  accent: "bg-accent/20 text-white ring-1 ring-accent/40",
  loss: "bg-loss/20 text-white ring-1 ring-loss/40",
};

export function FrequencyPills({
  value,
  onChange,
  tone = "accent",
}: FrequencyPillsProps) {
  return (
    <div className="flex gap-1.5">
      {FREQUENCIES.map((f) => {
        const active = value === f;

        return (
          <button
            key={f}
            aria-pressed={active}
            className={clsx(
              "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-wide transition-colors",
              active
                ? TONE_ACTIVE[tone]
                : "bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white",
            )}
            type="button"
            onClick={() => onChange(f)}
          >
            {FREQUENCY_PILL[f]}
          </button>
        );
      })}
    </div>
  );
}
