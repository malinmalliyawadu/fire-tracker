import type { ProjectionPoint, Settings } from "@/types";
import type { ProjectionLiability } from "./projection";

import { convert } from "./currency";
import { hypotheticalKidsCostByYear } from "./kids";
import { generateProjection } from "./projection";

export interface ProjectionInputBundle {
  currentNetWorth: number;
  monthlySavings: number;
  expectedReturn: number;
  retirementAge: number;
  /** Annual expenses today, when itemised expenses should override settings. */
  annualExpenses?: number;
  /** Annual expenses once retired. */
  retirementExpenses?: number;
  /** Kid costs by year offset, in display currency. */
  kidsCostByYear?: number[];
  /** One-off costs (positive) and windfalls (negative) by year offset. */
  oneOffByYear?: number[];
  includeNzSuper?: boolean;
  /** KiwiSaver portion of currentNetWorth (display currency). */
  currentLockedNetWorth?: number;
  /** KiwiSaver portion of monthlySavings (display currency). */
  monthlyLockedSavings?: number;
  includeKids?: boolean;
  numberOfKids?: number;
  /** Debts to amortise. currentNetWorth must already be net of these. */
  liabilities?: ProjectionLiability[];
  /** Debts serviced but held outside the pot. Not netted off currentNetWorth. */
  externalLiabilities?: ProjectionLiability[];
  /** Annual income that continues through retirement (display currency). */
  retirementIncome?: number;
  /** Part-time earnings during early retirement (display currency). */
  baristaIncome?: number;
  /** Age the part-time earnings stop. */
  baristaUntilAge?: number;
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
  const toDisplay = (nzd: number) =>
    convert(nzd, "NZD", settings.displayCurrency, settings.usdToNzd);
  const nzSuperInDisplay = bundle.includeNzSuper ? toDisplay(annualNzd) : 0;

  // A partner reaches 65 on their own schedule; express that in your age.
  const household = settings.household;
  const includePartnerSuper =
    bundle.includeNzSuper &&
    household?.hasPartner &&
    household.includePartnerNzSuper;
  const ageGap =
    settings.currentAge - (household?.partnerAge ?? settings.currentAge);
  const partnerNzSuperStartAge = (settings.nzSuperStartAge ?? 65) + ageGap;

  // Hypothetical kids from the simulator stack on top of any real ones.
  const hypothetical = bundle.includeKids
    ? hypotheticalKidsCostByYear(bundle.numberOfKids ?? 0, years).map((nzd) =>
        convert(nzd, "NZD", settings.displayCurrency, settings.usdToNzd),
      )
    : [];
  const recorded = bundle.kidsCostByYear ?? [];
  const kidsCostByYear = Array.from(
    { length: Math.max(hypothetical.length, recorded.length) },
    (_, i) => (hypothetical[i] ?? 0) + (recorded[i] ?? 0),
  );

  return generateProjection({
    currentNetWorth: bundle.currentNetWorth,
    monthlySavings: bundle.monthlySavings,
    expectedReturn: bundle.expectedReturn,
    inflationRate: settings.inflationRate,
    currentAge: settings.currentAge,
    retirementAge: bundle.retirementAge,
    annualExpenses: bundle.annualExpenses ?? settings.annualExpenses,
    retirementExpenses:
      bundle.retirementExpenses ??
      settings.retirementExpenses ??
      bundle.annualExpenses ??
      settings.annualExpenses,
    spendingPhases: settings.spendingPhases,
    oneOffByYear: bundle.oneOffByYear,
    years,
    nzSuperAnnualInDisplay: nzSuperInDisplay,
    nzSuperStartAge: settings.nzSuperStartAge ?? 65,
    partnerNzSuperAnnual: includePartnerSuper ? toDisplay(annualNzd) : 0,
    partnerNzSuperStartAge,
    baristaIncomeAnnual: bundle.baristaIncome ?? 0,
    baristaUntilAge: bundle.baristaUntilAge,
    currentLockedNetWorth: bundle.currentLockedNetWorth ?? 0,
    monthlyLockedSavings: bundle.monthlyLockedSavings ?? 0,
    unlockAge: settings.kiwisaverUnlockAge ?? 65,
    kidsCostByYear,
    liabilities: bundle.liabilities,
    externalLiabilities: bundle.externalLiabilities,
    retirementIncomeAnnual: bundle.retirementIncome ?? 0,
  });
};
