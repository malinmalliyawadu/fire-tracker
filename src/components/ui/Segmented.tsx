import type { LucideIcon } from "lucide-react";

import clsx from "clsx";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

export interface SegmentOption<T> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Accessible name for an icon-only option. */
  ariaLabel?: string;
  /** Shown instead of `label` where the row is too narrow for the full word. */
  shortLabel?: string;
}

interface SegmentedProps<T> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  /** Stretch segments to fill the row. */
  grow?: boolean;
  ariaLabel: string;
}

/**
 * A segmented control with a sliding ink thumb.
 *
 * One component for every small exclusive choice: currency, frequency, file
 * format, theme. The thumb moves rather than fading so the eye can follow
 * which option it left and which it reached.
 */
export function Segmented<T extends string | number | null>({
  options,
  value,
  onChange,
  size = "md",
  grow = false,
  ariaLabel,
}: SegmentedProps<T>) {
  const group = useId();
  const reduce = useReducedMotion();

  return (
    <LayoutGroup id={group}>
      <div
        aria-label={ariaLabel}
        className={clsx(
          "inline-flex items-center rounded-lg bg-wash p-0.5",
          grow && "flex w-full",
        )}
        role="radiogroup"
      >
        {options.map((option) => {
          const active = option.value === value;
          const Icon = option.icon;

          return (
            <button
              key={String(option.value)}
              aria-checked={active}
              aria-label={option.ariaLabel}
              className={clsx(
                "relative isolate inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium transition-colors duration-[var(--dur-hover)]",
                size === "sm"
                  ? "h-7 px-2.5 text-[12.5px]"
                  : "h-8 px-3 text-[13px]",
                grow && "flex-1",
                active ? "text-on-ink" : "text-ink-2 hover:text-ink",
              )}
              role="radio"
              title={option.ariaLabel}
              type="button"
              onClick={() => onChange(option.value)}
            >
              {active && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[7px] bg-ink shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
                  layoutId="segmented-thumb"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", duration: 0.32, bounce: 0.12 }
                  }
                />
              )}
              {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
              {option.shortLabel ? (
                <>
                  <span className="sm:hidden">{option.shortLabel}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </>
              ) : (
                option.label
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
