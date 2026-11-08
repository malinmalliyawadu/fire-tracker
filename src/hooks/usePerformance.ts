import type { BenchmarkSeries, Performance } from "@/domain/benchmark";

import { useMemo } from "react";

import sp500 from "@/data/sp500.json";
import { measurePerformance } from "@/domain/benchmark";
import { inCurrency } from "@/domain/tracking";
import { usePlanContributions, usePlanTracking } from "@/store/derived";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";

const SP500: BenchmarkSeries = sp500;

/**
 * The record measured against the S&P 500.
 *
 * Amounts come back in the display currency. The index is read in the currency
 * the record began in, so that flipping the display can't change a return.
 */
export function usePerformance(): Performance | null {
  const snapshots = useHistory((s) => s.snapshots);
  const displayCurrency = useSettings((s) => s.settings.displayCurrency);
  const usdToNzd = useSettings((s) => s.settings.usdToNzd);
  const { monthlyContributions } = usePlanContributions();
  const { excluded } = usePlanTracking();

  return useMemo(() => {
    const earliest = [...snapshots].sort((a, b) =>
      a.date.localeCompare(b.date),
    )[0];

    if (!earliest) return null;

    return measurePerformance(
      inCurrency(snapshots, displayCurrency, usdToNzd),
      monthlyContributions,
      SP500,
      earliest.currency,
      excluded,
    );
  }, [snapshots, displayCurrency, usdToNzd, monthlyContributions, excluded]);
}
