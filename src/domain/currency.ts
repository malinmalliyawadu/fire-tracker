import type { Currency } from "@/types";

export interface ExchangeRateResult {
  rate: number;
  timestamp: string;
}

export const FALLBACK_USD_TO_NZD = 1.65;

export async function fetchUsdToNzd(): Promise<ExchangeRateResult> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");

    if (!res.ok) throw new Error("FX fetch failed");
    const data = (await res.json()) as { rates?: Record<string, number> };

    if (!data.rates?.NZD) throw new Error("No NZD rate in response");

    return { rate: data.rates.NZD, timestamp: new Date().toISOString() };
  } catch {
    return {
      rate: FALLBACK_USD_TO_NZD,
      timestamp: new Date().toISOString(),
    };
  }
}

export const convert = (
  amount: number,
  from: Currency,
  to: Currency,
  usdToNzd: number,
): number => {
  if (from === to) return amount;
  if (from === "USD" && to === "NZD") return amount * usdToNzd;

  return amount / usdToNzd;
};

const FREQ_TO_MONTHLY: Record<string, number> = {
  weekly: 52 / 12,
  fortnightly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

export const toMonthly = (
  amount: number,
  frequency: keyof typeof FREQ_TO_MONTHLY,
): number => {
  return amount * (FREQ_TO_MONTHLY[frequency] ?? 1);
};
