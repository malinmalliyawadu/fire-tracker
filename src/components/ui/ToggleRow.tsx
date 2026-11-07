import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import clsx from "clsx";

interface SwitchProps {
  checked: boolean;
  className?: string;
}

/** The visual half of a switch; the row that contains it owns the button. */
export function SwitchMark({ checked, className }: SwitchProps) {
  return (
    <span
      aria-hidden
      className={clsx(
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-[var(--dur-hover)]",
        checked ? "bg-ink" : "bg-ink-4/60",
        className,
      )}
    >
      <span
        className={clsx(
          "h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out)]",
          checked && "translate-x-4",
        )}
      />
    </span>
  );
}

interface ToggleRowProps {
  label: string;
  /** Reads differently on and off, so the caption always describes reality. */
  hint: ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: LucideIcon;
  /**
   * Drop the row's own frame, for rows that sit inside a container already
   * carrying one (e.g. a toggle with an expandable row beneath it).
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
        "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-[var(--dur-hover)]",
        !bare && "rounded-lg border border-line hover:border-ink-3",
      )}
      type="button"
      onClick={() => onChange(!value)}
    >
      {Icon && (
        <span
          className={clsx(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors duration-[var(--dur-hover)]",
            value ? "bg-ink text-on-ink" : "bg-wash text-ink-2",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">
          {hint}
        </span>
      </span>
      <SwitchMark checked={value} />
    </button>
  );
}
