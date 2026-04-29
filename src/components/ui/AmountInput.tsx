import type { Currency } from "@/types";
import type { ReactNode } from "react";

import clsx from "clsx";

interface AmountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: Currency;
  hint?: ReactNode;
  action?: ReactNode;
  size?: "md" | "lg";
  tone?: "accent" | "loss";
  placeholder?: string;
  autoFocus?: boolean;
}

export function AmountInput({
  label,
  value,
  onChange,
  currency,
  hint,
  action,
  size = "lg",
  tone = "accent",
  placeholder = "0",
  autoFocus,
}: AmountInputProps) {
  const symbol = currency === "NZD" ? "NZ$" : "US$";
  const focusRing =
    tone === "accent"
      ? "focus-within:border-accent/40 focus-within:bg-accent/[0.04]"
      : "focus-within:border-loss/40 focus-within:bg-loss/[0.04]";

  return (
    <div
      className={clsx(
        "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors",
        focusRing,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          {label}
        </span>
        {action}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={clsx(
            "font-mono font-medium text-ink-400",
            size === "lg" ? "text-xl" : "text-base",
          )}
        >
          {symbol}
        </span>
        <input
          autoFocus={autoFocus}
          className={clsx(
            "min-w-0 flex-1 bg-transparent font-mono tabular font-semibold tracking-tight outline-none placeholder:text-ink-600",
            size === "lg" ? "text-3xl" : "text-xl",
          )}
          inputMode="decimal"
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {hint && <div className="mt-2 text-[11px] text-ink-400">{hint}</div>}
    </div>
  );
}
