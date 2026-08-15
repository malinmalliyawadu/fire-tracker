import type { ReactNode } from "react";

import clsx from "clsx";
import { useId } from "react";

import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useNumericField } from "@/hooks/useNumericField";
import { FieldLabel } from "@/components/ui/Field";

type CardSize = "sm" | "md" | "lg";

interface NumericCardProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Control pinned to the right of the label row, e.g. a currency toggle. */
  action?: ReactNode;
  /** Read-only figure pinned to the right of the label row. */
  meta?: ReactNode;
  /** Sits immediately before the number, e.g. "NZ$". */
  prefix?: ReactNode;
  /** Hugs the number, e.g. "%". */
  unit?: ReactNode;
  /** Pinned to the right of the value row, e.g. "Monthly". */
  trailing?: ReactNode;
  hint?: ReactNode;
  size?: CardSize;
  tone?: "accent" | "loss";
  placeholder?: string;
  focusOnMount?: boolean;
  allowDecimal?: boolean;
  grouping?: boolean;
}

const VALUE_SIZE: Record<CardSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

const AFFIX_SIZE: Record<CardSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

const TONE_FOCUS: Record<NonNullable<NumericCardProps["tone"]>, string> = {
  accent: "focus-within:border-accent/40 focus-within:bg-accent/[0.04]",
  loss: "focus-within:border-loss/40 focus-within:bg-loss/[0.04]",
};

/**
 * A framed numeric field: micro-label, an oversized figure, optional affixes.
 *
 * Every big number a dialog asks for goes through this, so contributions,
 * balances, payments and rates all share one type scale instead of each
 * editor picking its own.
 */
export function NumericCard({
  label,
  value,
  onChange,
  action,
  meta,
  prefix,
  unit,
  trailing,
  hint,
  size = "lg",
  tone = "accent",
  placeholder = "0",
  focusOnMount = false,
  allowDecimal = true,
  grouping = true,
}: NumericCardProps) {
  const field = useNumericField({ value, onChange, allowDecimal, grouping });
  const focusRef = useAutoFocus<HTMLInputElement>(focusOnMount);
  const id = useId();

  // The card itself carries the focus affordance, so the input suppresses the
  // global focus ring rather than drawing a second box inside the frame.
  const input = (
    <input
      ref={focusRef}
      className={clsx(
        "min-w-0 bg-transparent font-mono tabular font-semibold tracking-tight",
        "outline-none focus-visible:outline-none placeholder:text-ink-600",
        VALUE_SIZE[size],
        // Sized by the sizer below when a unit has to hug the number.
        unit ? "col-start-1 row-start-1 w-full" : "flex-1",
      )}
      id={id}
      placeholder={placeholder}
      // Drops the default 20-character intrinsic width, which would otherwise
      // set the grid track instead of the sizer.
      size={1}
      type="text"
      {...field}
    />
  );

  return (
    <div
      className={clsx(
        "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors",
        TONE_FOCUS[tone],
      )}
    >
      <div className="mb-2 flex min-h-[20px] items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action ??
          (meta && (
            <span className="font-mono tabular shrink-0 text-[11px] text-ink-400">
              {meta}
            </span>
          ))}
      </div>
      <div className="flex items-baseline gap-2">
        {prefix && (
          <span
            className={clsx(
              "shrink-0 font-mono font-medium text-ink-400",
              AFFIX_SIZE[size],
            )}
          >
            {prefix}
          </span>
        )}
        {unit ? (
          <span className="grid min-w-0 max-w-full">
            {/* Sizes the input to its own text so the unit sits beside it. */}
            <span
              aria-hidden
              className={clsx(
                "invisible col-start-1 row-start-1 whitespace-pre font-mono tabular font-semibold tracking-tight",
                VALUE_SIZE[size],
              )}
            >
              {field.value || placeholder}
            </span>
            {input}
          </span>
        ) : (
          input
        )}
        {unit && (
          <span
            className={clsx(
              "shrink-0 font-mono font-medium text-ink-400",
              AFFIX_SIZE[size],
            )}
          >
            {unit}
          </span>
        )}
        {trailing && (
          <span className="ml-auto shrink-0 text-[11px] text-ink-500">
            {trailing}
          </span>
        )}
      </div>
      {hint && <div className="mt-2 text-[11px] text-ink-400">{hint}</div>}
    </div>
  );
}
