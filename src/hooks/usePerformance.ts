import type {
  BenchmarkSeries,
  GrowthCurve,
  Performance,
} from "@/domain/benchmark";
import type { Currency } from "@/types";

import { useMemo } from "react";

import markets from "@/data/markets.json";
import nzRates from "@/data/nz-rates.json";
import {
  buildBenchmarks,
  measurePerformance,
  mortgageRateOf,
} from "@/domain/benchmark";
import { FAIR_DIVIDEND_RATE } from "@/domain/tax";
import { inCurrency } from "@/domain/tracking";
import {
  useAfterTaxReturn,
  useIncomeTotals,
  usePlanContributions,
  usePlanTracking,
  usePortfolioTotals,
} from "@/store/derived";
import { useHistory } from "@/store/history";
import { usePortfolio } from "@/store/portfolio";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";

const SP500: BenchmarkSeries = {
  dates: markets.dates,
  usd: markets.sp500,
  usdToNzd: markets.usdToNzd,
};
const GLOBAL: BenchmarkSeries = {
  dates: markets.dates,
  usd: markets.global,
  usdToNzd: markets.usdToNzd,
};
const CPI: GrowthCurve = nzRates.cpi;
const CASH: GrowthCurve = nzRates.cash;

export interface PerformanceView extends Performance {
  /** Currency the indices are measured in. */
  currency: Currency;
  /** The return the plan assumes, after tax when it models tax. */
  planRate: number;
  /** Null without a mortgage. */
  mortgageRate: number | null;
  /** What Fair Dividend Rate takes off a share fund each year. */
  shareTaxDrag: number;
}

/**
 * The record measured against every benchmark it can be.
 *
 * Amounts come back in the display currency. The indices are read in the
 * currency the record began in, so that flipping the display can't change a
 * return.
 */
export function usePerformance(): PerformanceView | null {
  const snapshots = useHistory((s) => s.snapshots);
  const liabilities = usePortfolio((s) => s.liabilities);
  const settings = useSettings((s) => s.settings);
  const afterTax = useUi((s) => s.benchmarksAfterTax);
  const planRate = useAfterTaxReturn();
  const income = useIncomeTotals();
  const { monthlyContributions } = usePlanContributions();
  const { excluded } = usePlanTracking();
  const { fireAssetsByType } = usePortfolioTotals();
  const { displayCurrency, usdToNzd, pirOverride } = settings;
  const pir = pirOverride ?? income.pir;
  const marginal = income.marginalRate;

  return useMemo(() => {
    const earliest = [...snapshots].sort((a, b) =>
      a.date.localeCompare(b.date),
    )[0];

    if (!earliest) return null;

    const currency = earliest.currency;
    const record = inCurrency(snapshots, displayCurrency, usdToNzd);
    const mortgageRate = mortgageRateOf(liabilities, usdToNzd);
    const performance = measurePerformance({
      snapshots: record,
      monthlyContributions,
      benchmarks: buildBenchmarks({
        sp500: SP500,
        global: GLOBAL,
        cpi: CPI,
        cash: CASH,
        currency,
        planReturn: planRate,
        mortgageRate,
        currentMix: fireAssetsByType,
        snapshots: record,
        tax: afterTax ? { pir, marginal } : null,
      }),
      marketDates: markets.dates,
      excluded,
    });

    return (
      performance && {
        ...performance,
        currency,
        planRate,
        mortgageRate,
        shareTaxDrag: pir * FAIR_DIVIDEND_RATE,
      }
    );
  }, [
    snapshots,
    liabilities,
    displayCurrency,
    usdToNzd,
    monthlyContributions,
    excluded,
    fireAssetsByType,
    planRate,
    afterTax,
    pir,
    marginal,
  ]);
}
