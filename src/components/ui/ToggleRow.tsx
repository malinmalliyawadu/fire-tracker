import type { LucideIcon } from "lucide-react";

import clsx from "clsx";

interface ToggleRowProps {
  label: string;
  /** One line under the label explaining what the current state means. */
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: LucideIcon;
  /**
   * Drop the row's own border and background, for rows that sit inside a
   * container already carrying them (e.g. a toggle with an expandable row
   * beneath it).
   */
  bare?: boolean;
}

/**
 * A full-width switch: label, hint, optional icon, and the switch itself.
 *
 * The whole row is the hit target, so the switch is presentational — the
 * button's aria-pressed carries the state.
 */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  icon: Icon,
  bare = false,
}: ToggleRowProps) {
  return (
    <button
      aria-pressed={value}
      className={clsx(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition",
        !bare && [
          "rounded-lg border",
          value
            ? "border-accent/40 bg-accent/10"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
        ],
      )}
      type="button"
      onClick={() => onChange(!value)}
    >
      {Icon && (
        <div
          className={clsx(
            "grid h-9 w-9 place-items-center rounded-lg transition-colors",
            value ? "bg-accent text-white" : "bg-white/[0.05] text-ink-300",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      )}
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-[11px] text-ink-400">{hint}</div>
      </div>
      <div
        className={clsx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          value ? "bg-accent" : "bg-white/15",
        )}
      >
        <div
          className={clsx(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            value && "translate-x-4",
          )}
        />
      </div>
    </button>
  );
}
