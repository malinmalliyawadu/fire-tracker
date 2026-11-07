import type { ReactNode } from "react";

import clsx from "clsx";
import { useId } from "react";

import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useNumericField } from "@/hooks/useNumericField";
import { CARD_FRAME, FieldLabel } from "@/components/ui/Field";

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
  placeholder?: string;
  focusOnMount?: boolean;
  allowDecimal?: boolean;
  grouping?: boolean;
}

const VALUE_SIZE: Record<CardSize, string> = {
  sm: "text-[20px]",
  md: "text-[26px]",
  lg: "text-[34px]",
};

const AFFIX_SIZE: Record<CardSize, string> = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[18px]",
};

/**
 * A framed numeric field: a label, an oversized figure, optional affixes.
 *
 * Every big number a form asks for goes through this, so balances, payments
 * and rates share one type scale instead of each editor picking its own.
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
  placeholder = "0",
  focusOnMount = false,
  allowDecimal = true,
  grouping = true,
}: NumericCardProps) {
  const field = useNumericField({ value, onChange, allowDecimal, grouping });
  const focusRef = useAutoFocus<HTMLInputElement>(focusOnMount);
  const id = useId();

  // The frame carries the focus affordance, so the input suppresses the
  // global ring rather than drawing a second box inside it.
  const input = (
    <input
      ref={focusRef}
      className={clsx(
        "display min-w-0 bg-transparent font-medium text-ink",
        "outline-none focus-visible:outline-none placeholder:text-ink-4",
        VALUE_SIZE[size],
        unit ? "col-start-1 row-start-1 w-full" : "flex-1",
      )}
      id={id}
      placeholder={placeholder}
      size={1}
      type="text"
      {...field}
    />
  );

  return (
    <div className={CARD_FRAME}>
      <div className="mb-1.5 flex min-h-[22px] items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action ??
          (meta && (
            <span className="num shrink-0 text-[12.5px] text-ink-3">
              {meta}
            </span>
          ))}
      </div>
      <div className="flex items-baseline gap-1.5">
        {prefix && (
          <span className={clsx("shrink-0 text-ink-3", AFFIX_SIZE[size])}>
            {prefix}
          </span>
        )}
        {unit ? (
          <span className="grid min-w-0 max-w-full">
            <span
              aria-hidden
              className={clsx(
                "display invisible col-start-1 row-start-1 whitespace-pre font-medium",
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
          <span className={clsx("shrink-0 text-ink-3", AFFIX_SIZE[size])}>
            {unit}
          </span>
        )}
        {trailing && (
          <span className="ml-auto shrink-0 text-[12.5px] text-ink-3">
            {trailing}
          </span>
        )}
      </div>
      {hint && <div className="mt-1.5 text-[12.5px] text-ink-3">{hint}</div>}
    </div>
  );
}
