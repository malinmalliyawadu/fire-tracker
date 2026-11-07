import { useMemo } from "react";

import { progressPercent } from "@/domain/fire";
import { yearsToTarget } from "@/domain/projection";
import { useSettings } from "@/store/settings";
import {
  useAccumulationProjection,
  useFireTargets,
  usePortfolioTotals,
} from "@/store/derived";

export interface FireSummary {
  /** Years until the traditional target is reached. Infinity if never. */
  years: number;
  /** Age at which it happens, rounded to the nearest whole year. */
  age: number | null;
  /** Progress toward the target, 0 to 100. */
  progress: number;
  reached: boolean;
  never: boolean;
  target: number;
  pot: number;
}

/**
 * The one sentence the whole app exists to produce: when, and how far along.
 * Shared by the overview headline and the status mark in the top bar.
 */
export function useFireSummary(): FireSummary {
  const targets = useFireTargets();
  const totals = usePortfolioTotals();
  const projection = useAccumulationProjection();
  const currentAge = useSettings((s) => s.settings.currentAge);

  return useMemo(() => {
    const target = targets.traditional;
    const years = yearsToTarget(projection, target);
    const reached = years <= 0;
    const never = !Number.isFinite(years);

    return {
      years,
      age: never ? null : Math.round(currentAge + Math.max(0, years)),
      progress: progressPercent(totals.fireNetWorth, target),
      reached,
      never,
      target,
      pot: totals.fireNetWorth,
    };
  }, [targets.traditional, projection, currentAge, totals.fireNetWorth]);
}

/** "14 years and 3 months", "8 months", "now". */
export const describeYears = (years: number): string => {
  if (!Number.isFinite(years)) return "beyond the horizon";
  if (years <= 0) return "now";

  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);

  if (months === 12) return describeYears(whole + 1);
  if (whole === 0) return `${months} month${months === 1 ? "" : "s"}`;

  const y = `${whole} year${whole === 1 ? "" : "s"}`;

  if (months === 0) return y;

  return `${y} and ${months} month${months === 1 ? "" : "s"}`;
};

/** "3 weeks", "2 months", "1 year and 4 months" for a span given in years. */
export const describeSpan = (years: number): string => {
  const days = Math.abs(years) * 365.25;

  if (days < 7) {
    const whole = Math.max(1, Math.round(days));

    return `${whole} day${whole === 1 ? "" : "s"}`;
  }
  if (days < 45) {
    const weeks = Math.round(days / 7);

    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }

  return describeYears(Math.abs(years));
};
