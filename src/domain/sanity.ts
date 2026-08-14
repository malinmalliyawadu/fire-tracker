import type { Settings } from "@/types";

export type WarningLevel = "warning" | "note";

export interface SanityWarning {
  id: string;
  level: WarningLevel;
  title: string;
  detail: string;
}

export interface SanityInputs {
  settings: Settings;
  /** Real (inflation-adjusted) return actually used by the projection. */
  realReturn: number;
  /** Spending the FIRE target is built from. */
  retirementExpenses: number;
  /** Savings rate, 0 when there's no income recorded. */
  savingsRate: number;
  hasIncome: boolean;
  /** Share of the portfolio in the single largest asset type. */
  topAssetShare: number;
  /** True when any liability's payment doesn't cover its interest. */
  hasNegativeAmortisation: boolean;
}

/**
 * Flag assumptions that would quietly produce a nonsense projection.
 *
 * These are checks on *internal consistency and plausibility*, not financial
 * advice: a withdrawal rate above the real return means drawing down faster
 * than the portfolio can refill, which is arithmetic, not opinion.
 */
export const checkAssumptions = (input: SanityInputs): SanityWarning[] => {
  const { settings } = input;
  const warnings: SanityWarning[] = [];

  if (settings.withdrawalRate > input.realReturn) {
    warnings.push({
      id: "withdrawal-exceeds-return",
      level: "warning",
      title: "Withdrawal rate is above your real return",
      detail: `Drawing ${pct(settings.withdrawalRate)} a year from a portfolio growing at ${pct(input.realReturn)} after inflation means the balance shrinks in real terms. It can still work over a fixed retirement, but it isn't self-sustaining.`,
    });
  }

  if (settings.expectedReturn > 0.1) {
    warnings.push({
      id: "optimistic-return",
      level: "warning",
      title: "Expected return is optimistic",
      detail: `${pct(settings.expectedReturn)} nominal is well above the long-run average for a diversified portfolio. Every year of the projection compounds this assumption, so small optimism here becomes large optimism at the end.`,
    });
  }

  if (settings.inflationRate <= 0) {
    warnings.push({
      id: "no-inflation",
      level: "warning",
      title: "Inflation is set to zero",
      detail:
        "Projections run in today's dollars by subtracting inflation from your return. With inflation at zero, future amounts are overstated in real terms.",
    });
  }

  if (settings.withdrawalRate > 0.05) {
    warnings.push({
      id: "high-withdrawal",
      level: "note",
      title: "Withdrawal rate above 5%",
      detail:
        "The 4% rule came from a 30-year US retirement. Above 5% the odds of outliving the portfolio climb sharply, especially with an early retirement.",
    });
  }

  if (settings.retirementAge <= settings.currentAge) {
    warnings.push({
      id: "retirement-not-future",
      level: "warning",
      title: "Retirement age isn't in the future",
      detail:
        "Your retirement age is at or below your current age, so the projection starts in drawdown immediately and never accumulates.",
    });
  }

  if (input.retirementExpenses <= 0) {
    warnings.push({
      id: "no-expenses",
      level: "warning",
      title: "No retirement spending recorded",
      detail:
        "Your FIRE target is built from retirement spending. With nothing recorded the target is zero and every progress figure reads as complete.",
    });
  }

  if (input.hasIncome && input.savingsRate <= 0) {
    warnings.push({
      id: "no-savings",
      level: "warning",
      title: "You're not saving anything",
      detail:
        "Income is recorded but nothing is going into assets, so net worth only moves with the market. Savings rate is the strongest lever you have on the FIRE date.",
    });
  }

  if (input.hasIncome && input.savingsRate > 0.7) {
    warnings.push({
      id: "very-high-savings",
      level: "note",
      title: "Savings rate above 70%",
      detail:
        "Achievable, but worth sanity-checking against your implied spending — it usually means some expenses haven't been entered.",
    });
  }

  if (input.topAssetShare > 0.7) {
    warnings.push({
      id: "concentrated",
      level: "note",
      title: "Portfolio is highly concentrated",
      detail: `${pct(input.topAssetShare)} sits in a single asset type. The projection applies one blended return to everything, so it can't show the swings a concentrated portfolio actually experiences.`,
    });
  }

  if (input.hasNegativeAmortisation) {
    warnings.push({
      id: "negative-amortisation",
      level: "warning",
      title: "A loan repayment doesn't cover its interest",
      detail:
        "At least one liability has a payment smaller than the interest it accrues, so its balance grows every year rather than reducing. Check the rate and payment on the Dashboard.",
    });
  }

  return warnings;
};

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
