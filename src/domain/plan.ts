import type { ProjectionPoint, Settings } from "@/types";
import type { ProjectionLiability } from "./projection";

import { convert } from "./currency";
import { generateProjection } from "./projection";

/**
 * Indicative annual cost per dependent child in NZD. Roughly tracks NZ
 * household estimates of ~$200–$300/wk per child once accounting for food,
 * activities, childcare, and education extras.
 */
export const KID_ANNUAL_COST_NZD = 15_000;

/** How long a kid is treated as a dependent in the simulation. */
export const KID_DEPENDENT_YEARS = 18;

export interface ProjectionInputBundle {
  currentNetWorth: number;
  monthlySavings: number;
  expectedReturn: number;
  retirementAge: number;
  includeNzSuper?: boolean;
  /** KiwiSaver portion of currentNetWorth (display currency). */
  currentLockedNetWorth?: number;
  /** KiwiSaver portion of monthlySavings (display currency). */
  monthlyLockedSavings?: number;
  includeKids?: boolean;
  numberOfKids?: number;
  /** Debts to amortise. currentNetWorth must already be net of these. */
  liabilities?: ProjectionLiability[];
}

/**
 * Turn a set of scenario inputs plus the user's settings into a projection.
 * Shared by the app's hooks and the exporter so both tell the same story.
 */
export const buildProjection = (
  bundle: ProjectionInputBundle,
  settings: Settings,
  years = 40,
): ProjectionPoint[] => {
  const annualNzd = settings.nzSuperAnnual ?? 28_000;
  const nzSuperInDisplay = bundle.includeNzSuper
    ? convert(annualNzd, "NZD", settings.displayCurrency, settings.usdToNzd)
    : 0;

  const kids = bundle.includeKids ? Math.max(0, bundle.numberOfKids ?? 0) : 0;
  const kidsAnnualCost =
    kids > 0
      ? convert(
          KID_ANNUAL_COST_NZD * kids,
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
    kidsAnnualCost,
    kidsYears: KID_DEPENDENT_YEARS,
    liabilities: bundle.liabilities,
  });
};
