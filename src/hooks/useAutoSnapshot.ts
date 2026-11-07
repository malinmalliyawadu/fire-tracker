import { useEffect } from "react";

import { useFireSummary } from "@/hooks/useFireSummary";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";
import { usePortfolioTotals } from "@/store/derived";

/**
 * Snapshots net worth once per day automatically. Run once at app root.
 * The history store dedupes by day, so calling this on every change is safe.
 */
export function useAutoSnapshot() {
  const totals = usePortfolioTotals();
  const currency = useSettings((s) => s.settings.displayCurrency);
  const takeSnapshot = useHistory((s) => s.takeSnapshot);
  const { years } = useFireSummary();

  const { netWorth, assetsTotal, liabilitiesTotal } = totals;
  const yearsToFire = Number.isFinite(years) ? years : undefined;

  useEffect(() => {
    // Skip when portfolio is empty (avoids a $0 snapshot on first load).
    if (assetsTotal === 0 && liabilitiesTotal === 0) return;

    takeSnapshot({
      netWorth,
      assetsTotal,
      liabilitiesTotal,
      currency,
      yearsToFire,
    });
  }, [
    netWorth,
    assetsTotal,
    liabilitiesTotal,
    currency,
    yearsToFire,
    takeSnapshot,
  ]);
}
