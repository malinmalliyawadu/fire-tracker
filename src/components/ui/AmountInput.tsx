import type { Currency } from "@/types";
import type { ReactNode } from "react";

import { NumericCard } from "@/components/ui/NumericCard";

interface AmountInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  currency: Currency;
  hint?: ReactNode;
  /** Control pinned to the right of the label row, e.g. a currency toggle. */
  action?: ReactNode;
  /** Read-only figure pinned to the right of the label row. */
  meta?: ReactNode;
  /** Pinned to the right of the value row, e.g. "Monthly". */
  trailing?: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "accent" | "loss";
  placeholder?: string;
  focusOnMount?: boolean;
}

export const currencySymbol = (currency: Currency) =>
  currency === "NZD" ? "NZ$" : "US$";

/** A {@link NumericCard} prefixed with the currency symbol. */
export function AmountInput({
  label,
  value,
  onChange,
  currency,
  hint,
  action,
  meta,
  trailing,
  size = "lg",
  tone = "accent",
  placeholder = "0",
  focusOnMount = false,
}: AmountInputProps) {
  return (
    <NumericCard
      action={action}
      focusOnMount={focusOnMount}
      hint={hint}
      label={label}
      meta={meta}
      placeholder={placeholder}
      prefix={currencySymbol(currency)}
      size={size}
      tone={tone}
      trailing={trailing}
      value={value}
      onChange={onChange}
    />
  );
}
