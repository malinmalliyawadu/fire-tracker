import type { NetWorthSnapshot } from "@/store/history";

import { useEffect, useMemo } from "react";

import { useFireSummary } from "@/hooks/useFireSummary";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";
import { usePlanContributions, usePortfolioTotals } from "@/store/derived";

export type SnapshotReading = Omit<NetWorthSnapshot, "id" | "date">;

/**
 * Today's reading, as a snapshot would record it. Shared by the daily
 * automatic snapshot and the button, so the two never disagree on what a
 * snapshot holds.
 */
export function useSnapshotReading(): SnapshotReading {
  const totals = usePortfolioTotals();
  const contributions = usePlanContributions();
  const currency = useSettings((s) => s.settings.displayCurrency);
  const { years } = useFireSummary();

  const {
    netWorth,
    assetsTotal,
    liabilitiesTotal,
    fireNetWorth,
    fireAssetsTotal,
    fireAssetsByType,
  } = totals;
  const { monthlyContributions } = contributions;
  const yearsToFire = Number.isFinite(years) ? years : undefined;

  return useMemo(
    () => ({
      netWorth,
      assetsTotal,
      liabilitiesTotal,
      currency,
      yearsToFire,
      fireNetWorth,
      fireAssetsTotal,
      fireAssetsByType,
      monthlyContributions,
    }),
    [
      netWorth,
      assetsTotal,
      liabilitiesTotal,
      currency,
      yearsToFire,
      fireNetWorth,
      fireAssetsTotal,
      fireAssetsByType,
      monthlyContributions,
    ],
  );
}

/**
 * Snapshots net worth once per day automatically. Run once at app root.
 * The history store dedupes by day, so calling this on every change is safe.
 */
export function useAutoSnapshot() {
  const reading = useSnapshotReading();
  const takeSnapshot = useHistory((s) => s.takeSnapshot);

  useEffect(() => {
    // Skip when portfolio is empty (avoids a $0 snapshot on first load).
    if (reading.assetsTotal === 0 && reading.liabilitiesTotal === 0) return;

    takeSnapshot(reading);
  }, [reading, takeSnapshot]);
}
