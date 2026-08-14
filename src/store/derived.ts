import type { AssetType, FireTargets, ProjectionPoint } from "@/types";
import type { ProjectionLiability } from "@/domain/projection";

import { useMemo } from "react";

import { usePortfolio } from "./portfolio";
import { useSettings } from "./settings";

import { convert, toMonthly } from "@/domain/currency";
import { computeFireTargets } from "@/domain/fire";
import { buildProjection } from "@/domain/plan";

export interface PortfolioTotals {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  monthlyContributions: number;
  monthlyDebtPayments: number;
  /** KiwiSaver portion of assets, in display currency. */
  lockedAssetsTotal: number;
  /** Monthly contributions flowing into KiwiSaver, in display currency. */
  lockedMonthlyContributions: number;
  /** Liabilities normalised to display currency for the projection engine. */
  debts: ProjectionLiability[];
}

export const usePortfolioTotals = (): PortfolioTotals => {
  const assets = usePortfolio((s) => s.assets);
  const liabilities = usePortfolio((s) => s.liabilities);
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;

    let assetsTotal = 0;
    let lockedAssetsTotal = 0;
    let monthlyContributions = 0;
    let lockedMonthlyContributions = 0;

    for (const a of assets) {
      const valueDisplay = convert(a.value, a.currency, display, rate);
      const monthlyDisplay = toMonthly(
        convert(a.contribution, a.currency, display, rate),
        a.frequency,
      );

      assetsTotal += valueDisplay;
      monthlyContributions += monthlyDisplay;

      if (a.type === "kiwisaver") {
        lockedAssetsTotal += valueDisplay;
        lockedMonthlyContributions += monthlyDisplay;
      }
    }

    const debts: ProjectionLiability[] = liabilities.map((l) => ({
      balance: convert(l.balance, l.currency, display, rate),
      interestRate: l.interestRate,
      annualPayment:
        toMonthly(convert(l.payment, l.currency, display, rate), l.frequency) *
        12,
    }));

    const liabilitiesTotal = debts.reduce((sum, d) => sum + d.balance, 0);
    const monthlyDebtPayments = debts.reduce(
      (sum, d) => sum + d.annualPayment / 12,
      0,
    );

    return {
      assetsTotal,
      liabilitiesTotal,
      netWorth: assetsTotal - liabilitiesTotal,
      monthlyContributions,
      monthlyDebtPayments,
      lockedAssetsTotal,
      lockedMonthlyContributions,
      debts,
    };
  }, [assets, liabilities, settings]);
};

export interface AllocationSlice {
  type: AssetType;
  value: number;
  percent: number;
}

export interface AllocationSummary {
  total: number;
  slices: AllocationSlice[];
  topType: AssetType | null;
  topPercent: number;
  diversityScore: number;
}

export const useAllocation = (): AllocationSummary => {
  const assets = usePortfolio((s) => s.assets);
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;
    const breakdown: Record<AssetType, number> = {
      kiwisaver: 0,
      shares: 0,
      savings: 0,
      crypto: 0,
      property: 0,
      other: 0,
    };

    for (const a of assets) {
      breakdown[a.type] += convert(a.value, a.currency, display, rate);
    }

    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

    const slices: AllocationSlice[] = (Object.keys(breakdown) as AssetType[])
      .map((type) => ({
        type,
        value: breakdown[type],
        percent: total > 0 ? breakdown[type] / total : 0,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const topType = slices.length > 0 ? slices[0].type : null;
    const topPercent = slices.length > 0 ? slices[0].percent : 0;
    // Inverse Herfindahl: 1 = perfectly diversified, 0 = single asset
    const herf = slices.reduce((sum, s) => sum + s.percent ** 2, 0);
    const diversityScore = slices.length > 0 ? Math.max(0, 1 - herf) : 0;

    return { total, slices, topType, topPercent, diversityScore };
  }, [assets, settings]);
};

export const useFireTargets = (): FireTargets => {
  const settings = useSettings((s) => s.settings);

  return useMemo(
    () =>
      computeFireTargets({
        annualExpenses: settings.annualExpenses,
        withdrawalRate: settings.withdrawalRate,
        expectedReturn: settings.expectedReturn,
        inflationRate: settings.inflationRate,
        currentAge: settings.currentAge,
        retirementAge: settings.retirementAge,
      }),
    [settings],
  );
};

/** How far out the dashboard projects when deriving time-to-target. */
const DASHBOARD_HORIZON_YEARS = 60;

/**
 * The projection implied by the portfolio and settings as they stand, with no
 * simulation overrides. Time-to-target figures on the dashboard are read off
 * this so they agree with the Simulate chart.
 */
export const useCurrentProjection = (): ProjectionPoint[] => {
  const totals = usePortfolioTotals();
  const settings = useSettings((s) => s.settings);

  return useMemo(
    () =>
      buildProjection(
        {
          currentNetWorth: totals.netWorth,
          monthlySavings: totals.monthlyContributions,
          expectedReturn: settings.expectedReturn,
          retirementAge: settings.retirementAge,
          currentLockedNetWorth: totals.lockedAssetsTotal,
          monthlyLockedSavings: totals.lockedMonthlyContributions,
          liabilities: totals.debts,
        },
        settings,
        DASHBOARD_HORIZON_YEARS,
      ),
    [totals, settings],
  );
};
