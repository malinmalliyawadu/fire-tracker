import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import clsx from "clsx";

interface ToggleRowProps {
  label: string;
  /** Reads differently on and off, so the caption always describes reality. */
  hint: ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: LucideIcon;
  /**
   * Drop the row's own frame, for rows that sit inside a container already
   * carrying one (e.g. a toggle with an expandable row beneath it, where the
   * border has to wrap both).
   */
  bare?: boolean;
}

/** A full-width switch with a label and a caption explaining its effect. */
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
          "rounded-xl border",
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
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
            value ? "bg-accent text-white" : "bg-white/[0.05] text-ink-300",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-ink-400">
          {hint}
        </div>
      </div>
      <div
        className={clsx(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          value ? "bg-accent" : "bg-white/15",
        )}
      >
        <div
          className={clsx(
            "h-4 w-4 rounded-full bg-white transition-transform",
            value && "translate-x-4",
          )}
        />
      </div>
    </button>
  );
}
