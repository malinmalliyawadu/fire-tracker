import type { ProjectionPoint } from "@/types";

/** A debt that amortises over the life of the projection. */
export interface ProjectionLiability {
  /** Outstanding balance today, in display currency. */
  balance: number;
  /** Nominal annual interest rate, e.g. 0.062 for 6.2%. */
  interestRate: number;
  /** Nominal annual repayment, in display currency. */
  annualPayment: number;
}

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
  /** Total annual cost of dependent kids in display currency. 0 disables. */
  kidsAnnualCost?: number;
  /** Number of years from now that the kids cost applies. Defaults to 18. */
  kidsYears?: number;
  /**
   * Debts to amortise. `currentNetWorth` is assumed to already have these
   * balances subtracted, so they're added back internally to recover the
   * gross asset pot.
   *
   * Before retirement, repayments are assumed to come out of income, which
   * this model doesn't track — so servicing a loan doesn't drain the
   * portfolio, and net worth here isn't comparable to a debt-free run of the
   * same inputs. Once a loan clears, its repayment is redirected into
   * savings. After retirement there's no income left, so debt service is
   * funded from the portfolio alongside living expenses.
   */
  liabilities?: ProjectionLiability[];
}

interface DebtYear {
  /** Balance carried into the next year, nominal. */
  balance: number;
  /** Actually paid this year, nominal. Short of scheduled in the payoff year. */
  paid: number;
}

/**
 * Amortise one year of a loan in monthly steps: interest accrues on the
 * outstanding balance, then the payment is applied. The final payment is
 * clamped to what's actually owed, so `paid` falls short of the scheduled
 * amount in the year the loan clears. A payment that doesn't cover the
 * interest lets the balance grow, which is the honest outcome.
 */
const amortiseYear = (
  balance: number,
  interestRate: number,
  annualPayment: number,
): DebtYear => {
  const monthlyRate = interestRate / 12;
  const monthlyPayment = annualPayment / 12;

  let remaining = balance;
  let paid = 0;

  for (let month = 0; month < 12 && remaining > 0; month++) {
    const owed = remaining * (1 + monthlyRate);
    const payment = Math.min(monthlyPayment, owed);

    remaining = owed - payment;
    paid += payment;
  }

  return { balance: remaining, paid };
};

/**
 * Years until a projection first reaches `target`, interpolating between the
 * two bracketing years.
 *
 * Reading this off the projection rather than solving a compound-interest
 * formula keeps every surface agreeing with the chart: the closed form can't
 * see amortising debt, a locked KiwiSaver pot, dependent kids, or NZ Super.
 * Returns Infinity if the target is never reached within the horizon.
 */
export const yearsToTarget = (
  points: ProjectionPoint[],
  target: number,
): number => {
  if (target <= 0) return 0;
  if (points.length === 0) return Infinity;
  if (points[0].netWorth >= target) return 0;

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    if (current.netWorth >= target) {
      const span = current.netWorth - previous.netWorth;
      const fraction = span > 0 ? (target - previous.netWorth) / span : 0;

      return previous.year + fraction * (current.year - previous.year);
    }
  }

  return Infinity;
};

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
  const kidsAnnualCost = input.kidsAnnualCost ?? 0;
  const kidsYears = input.kidsYears ?? 18;

  const loans = (input.liabilities ?? []).map((l) => ({
    balance: Math.max(0, l.balance),
    interestRate: l.interestRate,
    annualPayment: Math.max(0, l.annualPayment),
  }));
  const scheduledPayments = loans.reduce((sum, l) => sum + l.annualPayment, 0);
  const startingDebt = loans.reduce((sum, l) => sum + l.balance, 0);

  // currentNetWorth arrives net of debt; add it back for the gross asset pot
  // so the two can be tracked (and compounded) independently.
  let locked = input.currentLockedNetWorth ?? 0;
  let accessible = input.currentNetWorth + startingDebt - locked;
  let contributed = 0;
  let withdrawn = 0;

  for (let year = 0; year <= input.years; year++) {
    const age = input.currentAge + year;
    const isUnlocked = age >= unlockAge;
    // Debt is nominal; everything else is in today's dollars.
    const deflator = Math.pow(1 + input.inflationRate, year);
    const nominalDebt = loans.reduce((sum, l) => sum + l.balance, 0);
    const realDebt = nominalDebt / deflator;

    // After unlock age, locked becomes accessible — report that way.
    const reportedAccessible = isUnlocked ? accessible + locked : accessible;
    const reportedLocked = isUnlocked ? 0 : locked;
    const roundedAccessible = Math.round(reportedAccessible);
    const roundedLocked = Math.round(reportedLocked);
    const roundedDebt = Math.round(realDebt);

    points.push({
      year,
      age,
      netWorth: roundedAccessible + roundedLocked - roundedDebt,
      accessible: roundedAccessible,
      locked: roundedLocked,
      debt: roundedDebt,
      contributed: Math.round(contributed),
      withdrawn: Math.round(withdrawn),
    });

    if (year >= input.years) continue;

    const isRetired = age >= input.retirementAge;
    const kidsCost = year < kidsYears ? kidsAnnualCost : 0;

    // Service the debts for this year and see what falls away.
    let paidNominal = 0;

    for (const loan of loans) {
      const result = amortiseYear(
        loan.balance,
        loan.interestRate,
        loan.annualPayment,
      );

      loan.balance = result.balance;
      paidNominal += result.paid;
    }

    const debtServiceReal = paidNominal / deflator;
    // Repayments that no longer have a loan to go to become investable cash.
    const freedReal = (scheduledPayments - paidNominal) / deflator;

    if (isRetired) {
      const supplement = age >= nzSuperStart ? nzSuper : 0;
      const portfolioWithdrawal = Math.max(
        0,
        input.annualExpenses + kidsCost + debtServiceReal - supplement,
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
      // Debt service comes out of income, which isn't modelled — only the
      // freed-up repayments reach the portfolio.
      contributed += annualSavings + freedReal;
      accessible =
        (accessible + annualAccessibleSavings + freedReal - kidsCost) *
        (1 + realReturn);
      locked = (locked + annualLockedSavings) * (1 + realReturn);
    }
  }

  return points;
};
