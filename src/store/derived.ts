import { useMemo } from "react";

import type { AssetType, FireTargets, ProjectionPoint, Settings } from "@/types";

import { convert, toMonthly } from "@/domain/currency";
import { computeFireTargets } from "@/domain/fire";
import { generateProjection } from "@/domain/projection";

import { usePortfolio } from "./portfolio";
import { useSettings } from "./settings";

export interface PortfolioTotals {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  monthlyContributions: number;
  monthlyDebtPayments: number;
  monthlySavings: number;
  /** KiwiSaver portion of assets, in display currency. */
  lockedAssetsTotal: number;
  /** Monthly contributions flowing into KiwiSaver, in display currency. */
  lockedMonthlyContributions: number;
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

    const liabilitiesTotal = liabilities.reduce(
      (sum, l) => sum + convert(l.balance, l.currency, display, rate),
      0,
    );
    const monthlyDebtPayments = liabilities.reduce(
      (sum, l) =>
        sum +
        toMonthly(convert(l.payment, l.currency, display, rate), l.frequency),
      0,
    );

    return {
      assetsTotal,
      liabilitiesTotal,
      netWorth: assetsTotal - liabilitiesTotal,
      monthlyContributions,
      monthlyDebtPayments,
      monthlySavings: monthlyContributions + monthlyDebtPayments,
      lockedAssetsTotal,
      lockedMonthlyContributions,
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

export interface ProjectionInputBundle {
  currentNetWorth: number;
  monthlySavings: number;
  expectedReturn: number;
  retirementAge: number;
  withdrawalRate: number;
  includeNzSuper?: boolean;
  /** KiwiSaver portion of currentNetWorth (display currency). */
  currentLockedNetWorth?: number;
  /** KiwiSaver portion of monthlySavings (display currency). */
  monthlyLockedSavings?: number;
}

export const buildProjection = (
  bundle: ProjectionInputBundle,
  settings: Settings,
  years = 40,
): ProjectionPoint[] => {
  const annualNzd = settings.nzSuperAnnual ?? 28_000;
  const nzSuperInDisplay = bundle.includeNzSuper
    ? convert(
        annualNzd,
        "NZD",
        settings.displayCurrency,
        settings.usdToNzd,
      )
    : 0;

  return generateProjection({
    currentNetWorth: bundle.currentNetWorth,
    monthlySavings: bundle.monthlySavings,
    expectedReturn: bundle.expectedReturn,
    inflationRate: settings.inflationRate,
    currentAge: settings.currentAge,
    retirementAge: bundle.retirementAge,
    annualExpenses: settings.annualExpenses,
    years,
    nzSuperAnnualInDisplay: nzSuperInDisplay,
    nzSuperStartAge: settings.nzSuperStartAge ?? 65,
    currentLockedNetWorth: bundle.currentLockedNetWorth ?? 0,
    monthlyLockedSavings: bundle.monthlyLockedSavings ?? 0,
    unlockAge: settings.kiwisaverUnlockAge ?? 65,
  });
};
