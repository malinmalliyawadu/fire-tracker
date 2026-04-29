import type { Currency } from "@/types";

const localeFor = (currency: Currency): string =>
  currency === "NZD" ? "en-NZ" : "en-US";

export const formatMoney = (amount: number, currency: Currency = "NZD"): string => {
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMoneyCompact = (
  amount: number,
  currency: Currency = "NZD",
): string => {
  const abs = Math.abs(amount);
  // Intl compact rounds aggressively at small magnitudes; fall back to full for < 1k
  if (abs < 1000) return formatMoney(amount, currency);

  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatYears = (years: number): string => {
  if (!isFinite(years)) return "∞";
  if (years <= 0) return "Now";

  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);

  if (whole === 0) return `${months}mo`;
  if (months === 0) return `${whole}y`;
  if (months === 12) return `${whole + 1}y`;

  return `${whole}y ${months}mo`;
};

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
