import type { Currency } from "@/types";

import clsx from "clsx";

interface CurrencyToggleProps {
  value: Currency;
  onChange: (value: Currency) => void;
}

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.06] bg-black/30 p-0.5">
      {(["NZD", "USD"] as Currency[]).map((c) => {
        const active = value === c;

        return (
          <button
            key={c}
            aria-pressed={active}
            className={clsx(
              "rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide transition-all",
              active
                ? "bg-white/[0.12] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]"
                : "text-ink-400 hover:text-white",
            )}
            onClick={() => onChange(c)}
            type="button"
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
