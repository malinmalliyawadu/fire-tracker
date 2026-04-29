import type { ProjectionPoint } from "@/types";

export interface ProjectionInputs {
  currentNetWorth: number;
  monthlySavings: number;
  expectedReturn: number;
  inflationRate: number;
  currentAge: number;
  retirementAge: number;
  annualExpenses: number;
  years: number;
  /** Annual NZ Super income in display currency. 0 disables it. */
  nzSuperAnnualInDisplay?: number;
  /** Age at which NZ Super begins. Defaults to 65. */
  nzSuperStartAge?: number;
  /**
   * Portion of currentNetWorth that's locked (e.g. KiwiSaver). Cannot be
   * withdrawn before unlockAge but still earns the same return.
   */
  currentLockedNetWorth?: number;
  /** Portion of monthlySavings that flows into the locked pot. */
  monthlyLockedSavings?: number;
  /** Age at which the locked pot becomes available. Defaults to 65. */
  unlockAge?: number;
}

export const generateProjection = (
  input: ProjectionInputs,
): ProjectionPoint[] => {
  const points: ProjectionPoint[] = [];
  const realReturn = input.expectedReturn - input.inflationRate;
  const annualSavings = input.monthlySavings * 12;
  const annualLockedSavings = (input.monthlyLockedSavings ?? 0) * 12;
  const annualAccessibleSavings = annualSavings - annualLockedSavings;
  const nzSuper = input.nzSuperAnnualInDisplay ?? 0;
  const nzSuperStart = input.nzSuperStartAge ?? 65;
  const unlockAge = input.unlockAge ?? 65;

  let locked = input.currentLockedNetWorth ?? 0;
  let accessible = input.currentNetWorth - locked;
  let contributed = 0;
  let withdrawn = 0;

  for (let year = 0; year <= input.years; year++) {
    const age = input.currentAge + year;
    const isUnlocked = age >= unlockAge;

    // After unlock age, locked becomes accessible — report that way.
    const reportedAccessible = isUnlocked ? accessible + locked : accessible;
    const reportedLocked = isUnlocked ? 0 : locked;
    const roundedAccessible = Math.round(reportedAccessible);
    const roundedLocked = Math.round(reportedLocked);

    points.push({
      year,
      age,
      netWorth: roundedAccessible + roundedLocked,
      accessible: roundedAccessible,
      locked: roundedLocked,
      contributed: Math.round(contributed),
      withdrawn: Math.round(withdrawn),
    });

    if (year >= input.years) continue;

    const isRetired = age >= input.retirementAge;

    if (isRetired) {
      const supplement = age >= nzSuperStart ? nzSuper : 0;
      const portfolioWithdrawal = Math.max(
        0,
        input.annualExpenses - supplement,
      );

      if (isUnlocked) {
        // Both pots accessible — combine and withdraw from the merged pool.
        const combined = accessible + locked;

        withdrawn += Math.max(0, Math.min(portfolioWithdrawal, combined));
        accessible = (combined - portfolioWithdrawal) * (1 + realReturn);
        locked = 0;
      } else {
        // Pre-unlock retirement gap: withdraw from accessible only,
        // locked keeps compounding untouched.
        withdrawn += Math.max(0, Math.min(portfolioWithdrawal, accessible));
        accessible = (accessible - portfolioWithdrawal) * (1 + realReturn);
        locked = locked * (1 + realReturn);
      }
    } else {
      contributed += annualSavings;
      accessible = (accessible + annualAccessibleSavings) * (1 + realReturn);
      locked = (locked + annualLockedSavings) * (1 + realReturn);
    }
  }

  return points;
};
