import type { ProjectionPoint, SpendingPhases } from "@/types";

/**
 * Multiplier applied to retirement spending at a given age. Spending tends to
 * fall in real terms as retirees slow down, then fall again in the late years.
 */
export const spendingMultiplier = (
  age: number,
  phases?: SpendingPhases,
): number => {
  if (!phases?.enabled) return 1;
  if (age >= phases.noGoFromAge) return phases.noGoMultiplier;
  if (age >= phases.slowGoFromAge) return phases.slowGoMultiplier;

  return phases.goGoMultiplier;
};

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
   * A partner's NZ Super, in display currency. Kept separate because a
   * younger partner becomes eligible years later, and that gap has to be
   * funded from the portfolio.
   */
  partnerNzSuperAnnual?: number;
  /** Age *of the primary person* when the partner's Super starts. */
  partnerNzSuperStartAge?: number;
  /**
   * Part-time earnings during early retirement — Barista FIRE. Reduces what
   * the portfolio has to cover until `baristaUntilAge`.
   */
  baristaIncomeAnnual?: number;
  /** Age the part-time income stops. Defaults to the NZ Super age. */
  baristaUntilAge?: number;
  /**
   * Portion of currentNetWorth that's locked (e.g. KiwiSaver). Cannot be
   * withdrawn before unlockAge but still earns the same return.
   */
  currentLockedNetWorth?: number;
  /** Portion of monthlySavings that flows into the locked pot. */
  monthlyLockedSavings?: number;
  /** Age at which the locked pot becomes available. Defaults to 65. */
  unlockAge?: number;
  /**
   * Income that keeps arriving throughout retirement (rental, royalties), in
   * display currency. Reduces what has to come out of the portfolio, the same
   * way NZ Super does, but without an age gate.
   */
  retirementIncomeAnnual?: number;
  /**
   * Annual cost of dependent kids in display currency, indexed by year offset.
   * Shorter arrays are treated as zero beyond their end.
   */
  kidsCostByYear?: number[];
  /** Annual spending once retired. Defaults to `annualExpenses`. */
  retirementExpenses?: number;
  /** Multiplies retirement spending as the retiree ages. */
  spendingPhases?: SpendingPhases;
  /**
   * One-off cash flows in display currency, indexed by year offset. Positive
   * is a cost, negative is money arriving.
   */
  oneOffByYear?: number[];
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
  /**
   * Debts serviced from the same cash flows as `liabilities`, but whose
   * balances sit outside the tracked pot — the mortgage on a home excluded
   * from the FIRE picture. `currentNetWorth` is *not* net of these, so they're
   * neither added back nor reported in `debt`.
   *
   * The repayment is still a real cost: it's withdrawn alongside living
   * expenses after retirement, and it still frees up cash once the loan
   * clears. Leaving these out entirely would understate retirement spending
   * for anyone carrying a mortgage they don't count as part of the pot.
   */
  externalLiabilities?: ProjectionLiability[];
}

/**
 * Years until a loan is repaid, or Infinity when the payment never clears it.
 *
 * Walks the same monthly amortisation the projection uses rather than solving
 * the closed form, so the payoff date shown next to a debt is the one the
 * chart actually bends at. A payment that doesn't cover the interest never
 * pays off, which is the honest answer rather than a negative number.
 */
export const yearsToPayoff = (
  balance: number,
  interestRate: number,
  annualPayment: number,
  maxYears = 100,
): number => {
  if (balance <= 0) return 0;
  if (annualPayment <= 0) return Infinity;

  const monthlyRate = interestRate / 12;
  const monthlyPayment = annualPayment / 12;

  let remaining = balance;

  for (let month = 1; month <= maxYears * 12; month++) {
    const owed = remaining * (1 + monthlyRate);

    if (monthlyPayment >= owed) return month / 12;
    remaining = owed - monthlyPayment;
  }

  return Infinity;
};

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

export interface CoastPoint {
  /** Years from now that coasting becomes viable. */
  year: number;
  /** Age at that point. */
  age: number;
  /** Net worth at that point. */
  netWorth: number;
}

/**
 * The moment you could stop contributing entirely and still drift to `target`
 * by `retirementAge` on compounding alone — the Coast FIRE date.
 *
 * The existing coast *target* answers "how much do I need today"; this answers
 * "when do I get there", which is the more useful form: it's a date you can
 * put in a calendar and a point at which work becomes optional rather than
 * mandatory. Returns null if coasting never becomes viable in the horizon.
 */
export const coastPoint = (
  points: ProjectionPoint[],
  target: number,
  realReturn: number,
  retirementAge: number,
): CoastPoint | null => {
  if (target <= 0) return null;

  for (const point of points) {
    if (point.age > retirementAge) break;

    const yearsRemaining = retirementAge - point.age;
    const coasted =
      point.netWorth * Math.pow(1 + realReturn, Math.max(0, yearsRemaining));

    if (coasted >= target) {
      return { year: point.year, age: point.age, netWorth: point.netWorth };
    }
  }

  return null;
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
  const retirementIncome = input.retirementIncomeAnnual ?? 0;
  const partnerNzSuper = input.partnerNzSuperAnnual ?? 0;
  const partnerNzSuperStart = input.partnerNzSuperStartAge ?? 65;
  const baristaIncome = input.baristaIncomeAnnual ?? 0;
  const baristaUntilAge = input.baristaUntilAge ?? 65;
  const unlockAge = input.unlockAge ?? 65;
  const kidsCost = input.kidsCostByYear ?? [];
  const oneOffs = input.oneOffByYear ?? [];
  const retirementExpenses = input.retirementExpenses ?? input.annualExpenses;

  const normalise = (l: ProjectionLiability) => ({
    balance: Math.max(0, l.balance),
    interestRate: l.interestRate,
    annualPayment: Math.max(0, l.annualPayment),
  });

  // Netted debts are subtracted from currentNetWorth and reported in `debt`;
  // external ones are only serviced. Both are amortised from the same list, so
  // repayment cost and freed-up cash cover every loan the user carries.
  const netted = (input.liabilities ?? []).map(normalise);
  const external = (input.externalLiabilities ?? []).map(normalise);
  const loans = [...netted, ...external];
  const scheduledPayments = loans.reduce((sum, l) => sum + l.annualPayment, 0);
  const startingDebt = netted.reduce((sum, l) => sum + l.balance, 0);

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
    // Only netted debt is reported, so net worth stays consistent with the
    // pot: an external balance was never added to `accessible` to begin with.
    const nominalDebt = netted.reduce((sum, l) => sum + l.balance, 0);
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
    const kidsThisYear = kidsCost[year] ?? 0;
    const oneOffThisYear = oneOffs[year] ?? 0;

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
      const supplement =
        (age >= nzSuperStart ? nzSuper : 0) +
        (age >= partnerNzSuperStart ? partnerNzSuper : 0) +
        (age < baristaUntilAge ? baristaIncome : 0) +
        retirementIncome;
      const spending =
        retirementExpenses * spendingMultiplier(age, input.spendingPhases);
      const portfolioWithdrawal = Math.max(
        0,
        spending + kidsThisYear + oneOffThisYear + debtServiceReal - supplement,
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
        (accessible +
          annualAccessibleSavings +
          freedReal -
          kidsThisYear -
          oneOffThisYear) *
        (1 + realReturn);
      locked = (locked + annualLockedSavings) * (1 + realReturn);
    }
  }

  return points;
};
