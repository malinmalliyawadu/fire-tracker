import type { Currency } from "@/types";

import clsx from "clsx";

import { formatMoney, formatMoneyCompact } from "@/domain/format";

interface MoneyProps {
  amount: number;
  currency?: Currency;
  compact?: boolean;
  signed?: boolean;
  className?: string;
}

export function Money({
  amount,
  currency = "NZD",
  compact = false,
  signed = false,
  className,
}: MoneyProps) {
  const text = compact
    ? formatMoneyCompact(amount, currency)
    : formatMoney(amount, currency);

  const display = signed && amount > 0 ? `+${text}` : text;

  return (
    <span className={clsx("font-mono tabular tracking-tight", className)}>
      {display}
    </span>
  );
}
