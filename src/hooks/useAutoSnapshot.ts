import { useEffect } from "react";

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

  const { netWorth, assetsTotal, liabilitiesTotal } = totals;

  useEffect(() => {
    // Skip when portfolio is empty (avoids a $0 snapshot on first load).
    if (assetsTotal === 0 && liabilitiesTotal === 0) return;

    takeSnapshot({
      netWorth,
      assetsTotal,
      liabilitiesTotal,
      currency,
    });
  }, [netWorth, assetsTotal, liabilitiesTotal, currency, takeSnapshot]);
}
