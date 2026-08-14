import type { AssetType, FireTargets, ProjectionPoint } from "@/types";
import type { ProjectionLiability } from "@/domain/projection";
import type { SanityWarning } from "@/domain/sanity";

import { useMemo } from "react";

import { useExpenses } from "./expenses";
import { useHistory } from "./history";
import { useIncome } from "./income";
import { usePortfolio } from "./portfolio";
import { useSettings } from "./settings";

import { convert, toMonthly } from "@/domain/currency";
import { computeFireTargets, countsTowardFire } from "@/domain/fire";
import { kidsCostByYear as kidsCostNzdByYear } from "@/domain/kids";
import { buildProjection } from "@/domain/plan";
import { checkAssumptions } from "@/domain/sanity";
import { attributeGrowth, comparePlan } from "@/domain/tracking";
import {
  accLevy,
  blendedAfterTaxReturn,
  DEFAULT_EMPLOYER_KIWISAVER_RATE,
  esctRate,
  governmentContribution,
  marginalRate,
  payeTax,
  prescribedInvestorRate,
} from "@/domain/tax";

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
  /** Assets marked as funding retirement. */
  fireAssetsTotal: number;
  /** Debts netted off the retirement pot. */
  fireLiabilitiesTotal: number;
  /** The pot the FIRE target is measured against. */
  fireNetWorth: number;
  /** Contributions into assets that fund retirement. */
  fireMonthlyContributions: number;
  /** KiwiSaver that funds retirement — the locked pot the projection tracks. */
  fireLockedAssetsTotal: number;
  fireLockedMonthlyContributions: number;
  /** Only the debts the projection should amortise. */
  fireDebts: ProjectionLiability[];
  /** Net worth held outside the FIRE picture, e.g. the home you live in. */
  excludedNetWorth: number;
  /** True when any holding or debt has been taken out of the FIRE picture. */
  hasExclusions: boolean;
  /** True when a debt is excluded, so its repayments aren't projected. */
  hasExcludedDebt: boolean;
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
    let fireAssetsTotal = 0;
    let fireLockedAssetsTotal = 0;
    let fireMonthlyContributions = 0;
    let fireLockedMonthlyContributions = 0;
    let hasExclusions = false;

    for (const a of assets) {
      const valueDisplay = convert(a.value, a.currency, display, rate);
      const monthlyDisplay = toMonthly(
        convert(a.contribution, a.currency, display, rate),
        a.frequency,
      );
      const counts = countsTowardFire(a);
      const locked = a.type === "kiwisaver";

      assetsTotal += valueDisplay;
      monthlyContributions += monthlyDisplay;

      if (locked) {
        lockedAssetsTotal += valueDisplay;
        lockedMonthlyContributions += monthlyDisplay;
      }

      if (!counts) {
        hasExclusions = true;
        continue;
      }

      fireAssetsTotal += valueDisplay;
      fireMonthlyContributions += monthlyDisplay;

      if (locked) {
        fireLockedAssetsTotal += valueDisplay;
        fireLockedMonthlyContributions += monthlyDisplay;
      }
    }

    const toDebt = (l: (typeof liabilities)[number]): ProjectionLiability => ({
      balance: convert(l.balance, l.currency, display, rate),
      interestRate: l.interestRate,
      annualPayment:
        toMonthly(convert(l.payment, l.currency, display, rate), l.frequency) *
        12,
    });

    const debts: ProjectionLiability[] = liabilities.map(toDebt);
    const fireDebts: ProjectionLiability[] = liabilities
      .filter(countsTowardFire)
      .map(toDebt);
    const hasExcludedDebt = fireDebts.length < debts.length;

    const sumBalance = (list: ProjectionLiability[]) =>
      list.reduce((sum, d) => sum + d.balance, 0);

    const liabilitiesTotal = sumBalance(debts);
    const fireLiabilitiesTotal = sumBalance(fireDebts);
    const monthlyDebtPayments = debts.reduce(
      (sum, d) => sum + d.annualPayment / 12,
      0,
    );

    const netWorth = assetsTotal - liabilitiesTotal;
    const fireNetWorth = fireAssetsTotal - fireLiabilitiesTotal;

    return {
      assetsTotal,
      liabilitiesTotal,
      netWorth,
      monthlyContributions,
      monthlyDebtPayments,
      lockedAssetsTotal,
      lockedMonthlyContributions,
      debts,
      fireAssetsTotal,
      fireLiabilitiesTotal,
      fireNetWorth,
      fireMonthlyContributions,
      fireLockedAssetsTotal,
      fireLockedMonthlyContributions,
      fireDebts,
      excludedNetWorth: netWorth - fireNetWorth,
      hasExclusions: hasExclusions || hasExcludedDebt,
      hasExcludedDebt,
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
  /**
   * Largest share among the assets that fund retirement. Concentration only
   * matters where the blended return is applied, and an excluded home isn't
   * part of that.
   */
  fireTopPercent: number;
}

const emptyBreakdown = (): Record<AssetType, number> => ({
  kiwisaver: 0,
  shares: 0,
  savings: 0,
  crypto: 0,
  property: 0,
  other: 0,
});

const topShare = (breakdown: Record<AssetType, number>): number => {
  const values = Object.values(breakdown);
  const total = values.reduce((s, v) => s + v, 0);

  return total > 0 ? Math.max(...values) / total : 0;
};

export const useAllocation = (): AllocationSummary => {
  const assets = usePortfolio((s) => s.assets);
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;
    const breakdown = emptyBreakdown();
    const fireBreakdown = emptyBreakdown();

    for (const a of assets) {
      const value = convert(a.value, a.currency, display, rate);

      breakdown[a.type] += value;
      if (countsTowardFire(a)) fireBreakdown[a.type] += value;
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

    return {
      total,
      slices,
      topType,
      topPercent,
      diversityScore,
      fireTopPercent: topShare(fireBreakdown),
    };
  }, [assets, settings]);
};

export const useFireTargets = (): FireTargets => {
  const settings = useSettings((s) => s.settings);
  const budget = usePlanBudget();

  return useMemo(
    () =>
      computeFireTargets({
        // The target funds retirement, so it's built from retirement spending.
        annualExpenses: budget.retirementExpenses,
        withdrawalRate: settings.withdrawalRate,
        expectedReturn: settings.expectedReturn,
        inflationRate: settings.inflationRate,
        currentAge: settings.currentAge,
        retirementAge: settings.retirementAge,
      }),
    [settings, budget.retirementExpenses],
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
  const contributions = usePlanContributions();
  const expectedReturn = useAfterTaxReturn();
  const income = useIncomeTotals();
  const budget = usePlanBudget();
  const settings = useSettings((s) => s.settings);

  return useMemo(
    () =>
      buildProjection(
        {
          currentNetWorth: totals.fireNetWorth,
          monthlySavings: contributions.monthlyContributions,
          expectedReturn,
          retirementAge: settings.retirementAge,
          annualExpenses: budget.annualExpenses,
          retirementExpenses: budget.retirementExpenses,
          kidsCostByYear: budget.kidsCostByYear,
          oneOffByYear: budget.oneOffByYear,
          currentLockedNetWorth: totals.fireLockedAssetsTotal,
          monthlyLockedSavings: contributions.monthlyLockedContributions,
          liabilities: totals.fireDebts,
          retirementIncome: income.retirementIncomeAnnual,
        },
        settings,
        DASHBOARD_HORIZON_YEARS,
      ),
    [totals, contributions, expectedReturn, income, budget, settings],
  );
};

export interface IncomeTotals {
  /** Gross annual income across every source, display currency. */
  grossAnnual: number;
  /** Gross annual salary and wages only — what KiwiSaver and ACC apply to. */
  salaryAnnual: number;
  /** Income tax plus the ACC earner levy. */
  annualTax: number;
  /** Gross less tax, before KiwiSaver is deducted. */
  takeHomeAnnual: number;
  /** Employee KiwiSaver contributions, deducted from take-home pay. */
  employeeKiwisaverAnnual: number;
  /** Employer KiwiSaver contributions, net of ESCT. */
  employerKiwisaverAnnual: number;
  /** Annual government contribution. */
  govtContributionAnnual: number;
  /** Every KiwiSaver inflow combined. */
  kiwisaverAnnual: number;
  /** True when any salary source defines a KiwiSaver rate. */
  hasDerivedKiwisaver: boolean;
  /** Income that keeps paying after retirement, e.g. rental. */
  retirementIncomeAnnual: number;
  marginalRate: number;
  pir: number;
}

export const useIncomeTotals = (): IncomeTotals => {
  const sources = useIncome((s) => s.sources);
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;

    let grossAnnual = 0;
    let salaryAnnual = 0;
    let employeeKiwisaverAnnual = 0;
    let employerGross = 0;
    let retirementIncomeAnnual = 0;
    let hasDerivedKiwisaver = false;

    for (const source of sources) {
      const annual =
        toMonthly(
          convert(source.amount, source.currency, display, rate),
          source.frequency,
        ) * 12;

      grossAnnual += annual;
      if (source.continuesInRetirement) retirementIncomeAnnual += annual;

      if (source.type !== "salary") continue;

      salaryAnnual += annual;

      if (source.kiwisaverRate != null) {
        hasDerivedKiwisaver = true;
        employeeKiwisaverAnnual += annual * source.kiwisaverRate;
        employerGross +=
          annual *
          (source.employerKiwisaverRate ?? DEFAULT_EMPLOYER_KIWISAVER_RATE);
      }
    }

    // Employer contributions are taxed before they land in the fund.
    const employerKiwisaverAnnual =
      employerGross * (1 - esctRate(salaryAnnual + employerGross));
    const govtContributionAnnual = governmentContribution(
      employeeKiwisaverAnnual,
      grossAnnual,
    );

    const annualTax = payeTax(grossAnnual) + accLevy(salaryAnnual);

    return {
      grossAnnual,
      salaryAnnual,
      annualTax,
      takeHomeAnnual: grossAnnual - annualTax,
      employeeKiwisaverAnnual,
      employerKiwisaverAnnual,
      govtContributionAnnual,
      kiwisaverAnnual:
        employeeKiwisaverAnnual +
        employerKiwisaverAnnual +
        govtContributionAnnual,
      hasDerivedKiwisaver,
      retirementIncomeAnnual,
      marginalRate: marginalRate(grossAnnual),
      pir: prescribedInvestorRate(grossAnnual),
    };
  }, [sources, settings]);
};

export interface SavingsSummary {
  /** Everything that actually arrives: take-home plus employer and govt KiwiSaver. */
  incomeAvailable: number;
  /** Annual savings, including every KiwiSaver inflow. */
  annualSavings: number;
  /** Savings as a share of income available. 0 when there's no income yet. */
  savingsRate: number;
  /** What's left over after saving — implied spending. */
  impliedSpending: number;
  /** True once income has been entered, so the rate means something. */
  hasIncome: boolean;
}

/**
 * Savings rate, the single most predictive number in FIRE.
 *
 * Numerator and denominator are kept consistent: employee KiwiSaver comes out
 * of take-home pay, so it appears in both, while employer and government
 * contributions are added to each since they're money that arrives and is
 * saved in the same motion.
 */
export const useSavingsSummary = (): SavingsSummary => {
  const totals = usePortfolioTotals();
  const income = useIncomeTotals();

  return useMemo(() => {
    const nonKiwisaverSavings =
      (totals.monthlyContributions - totals.lockedMonthlyContributions) * 12;
    const annualSavings = nonKiwisaverSavings + income.kiwisaverAnnual;
    const incomeAvailable =
      income.takeHomeAnnual +
      income.employerKiwisaverAnnual +
      income.govtContributionAnnual;

    return {
      incomeAvailable,
      annualSavings,
      savingsRate: incomeAvailable > 0 ? annualSavings / incomeAvailable : 0,
      impliedSpending: incomeAvailable - annualSavings,
      hasIncome: income.grossAnnual > 0,
    };
  }, [totals, income]);
};

/**
 * The expected return after investment tax, blended across the portfolio.
 *
 * Returns the pre-tax figure untouched when tax modelling is switched off, so
 * the setting is a genuine toggle rather than a partial one.
 */
export const useAfterTaxReturn = (nominalReturn?: number): number => {
  const settings = useSettings((s) => s.settings);
  const assets = usePortfolio((s) => s.assets);
  const income = useIncomeTotals();

  return useMemo(() => {
    const nominal = nominalReturn ?? settings.expectedReturn;

    if (!settings.applyInvestmentTax) return nominal;

    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;
    // Only the retirement pot is projected, so only it should set the blend —
    // an excluded home shouldn't lift the return on the assets being drawn on.
    const weights = assets.filter(countsTowardFire).map((a) => ({
      type: a.type,
      value: convert(a.value, a.currency, display, rate),
    }));

    return blendedAfterTaxReturn(weights, nominal, {
      marginal: income.marginalRate,
      pir: settings.pirOverride ?? income.pir,
    });
  }, [assets, settings, income, nominalReturn]);
};

export interface PlanContributions {
  /** Total monthly contributions into assets, display currency. */
  monthlyContributions: number;
  /** Monthly contributions flowing into the locked KiwiSaver pot. */
  monthlyLockedContributions: number;
  /** True when KiwiSaver is derived from salary rather than entered by hand. */
  kiwisaverFromSalary: boolean;
}

/**
 * The contributions the plan should actually project.
 *
 * Only contributions into assets that fund retirement are projected — money
 * going into an excluded home builds net worth but not the FIRE pot.
 *
 * Once a salary defines a KiwiSaver rate, the derived contributions replace
 * whatever was typed on the KiwiSaver asset — otherwise the same money would
 * be counted twice.
 */
export const usePlanContributions = (): PlanContributions => {
  const totals = usePortfolioTotals();
  const income = useIncomeTotals();

  return useMemo(() => {
    if (!income.hasDerivedKiwisaver) {
      return {
        monthlyContributions: totals.fireMonthlyContributions,
        monthlyLockedContributions: totals.fireLockedMonthlyContributions,
        kiwisaverFromSalary: false,
      };
    }

    const nonLocked =
      totals.fireMonthlyContributions - totals.fireLockedMonthlyContributions;
    const locked = income.kiwisaverAnnual / 12;

    return {
      monthlyContributions: nonLocked + locked,
      monthlyLockedContributions: locked,
      kiwisaverFromSalary: true,
    };
  }, [totals, income]);
};

export interface PlanBudget {
  /** Annual spending today, itemised if entered, else the settings figure. */
  annualExpenses: number;
  /** Annual spending once retired. */
  retirementExpenses: number;
  /** Kid costs by year offset, in display currency. */
  kidsCostByYear: number[];
  /** One-off costs (positive) and windfalls (negative) by year offset. */
  oneOffByYear: number[];
  /** True when expenses are itemised rather than taken from settings. */
  itemised: boolean;
  /** Expenses that only start at retirement, e.g. travel or health cover. */
  retirementOnlyAnnual: number;
  /** Expenses that stop at retirement, e.g. commuting. */
  workOnlyAnnual: number;
}

/** How far ahead kid costs and one-off events are laid out. */
const BUDGET_HORIZON_YEARS = 60;

/**
 * The spending side of the plan: itemised expenses, dependent kids, and dated
 * one-off events, all normalised to display currency and year offsets.
 *
 * Itemised expenses take over from the single `annualExpenses` setting once
 * any are entered, so the FIRE target follows what's actually been recorded.
 */
export const usePlanBudget = (): PlanBudget => {
  const expenses = useExpenses((s) => s.expenses);
  const events = useExpenses((s) => s.events);
  const kids = useExpenses((s) => s.kids);
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const display = settings.displayCurrency;
    const rate = settings.usdToNzd;
    const startYear = new Date().getFullYear();

    let todayAnnual = 0;
    let retirementAnnual = 0;
    let retirementOnlyAnnual = 0;
    let workOnlyAnnual = 0;

    for (const expense of expenses) {
      const annual =
        toMonthly(
          convert(expense.amount, expense.currency, display, rate),
          expense.frequency,
        ) * 12;

      if (expense.startsAtRetirement) {
        retirementAnnual += annual;
        retirementOnlyAnnual += annual;
        continue;
      }

      todayAnnual += annual;
      if (expense.stopsAtRetirement) workOnlyAnnual += annual;
      else retirementAnnual += annual;
    }

    const itemised = expenses.length > 0;
    const annualExpenses = itemised ? todayAnnual : settings.annualExpenses;
    const retirementExpenses = itemised
      ? retirementAnnual
      : (settings.retirementExpenses ?? settings.annualExpenses);

    const kidsCostByYear = kidsCostNzdByYear({
      kids,
      startYear,
      years: BUDGET_HORIZON_YEARS,
    }).map((nzd) => convert(nzd, "NZD", display, rate));

    const oneOffByYear = Array.from(
      { length: BUDGET_HORIZON_YEARS + 1 },
      () => 0,
    );

    for (const event of events) {
      const offset = event.year - startYear;

      if (offset < 0 || offset > BUDGET_HORIZON_YEARS) continue;
      oneOffByYear[offset] += convert(
        event.amount,
        event.currency,
        display,
        rate,
      );
    }

    return {
      annualExpenses,
      retirementExpenses,
      kidsCostByYear,
      oneOffByYear,
      itemised,
      retirementOnlyAnnual,
      workOnlyAnnual,
    };
  }, [expenses, events, kids, settings]);
};

/**
 * Assumption warnings for the current plan. Empty when everything is
 * internally consistent.
 */
export const useSanityWarnings = (): SanityWarning[] => {
  const settings = useSettings((s) => s.settings);
  const totals = usePortfolioTotals();
  const allocation = useAllocation();
  const budget = usePlanBudget();
  const savings = useSavingsSummary();
  const afterTax = useAfterTaxReturn();

  return useMemo(
    () =>
      checkAssumptions({
        settings,
        realReturn: afterTax - settings.inflationRate,
        retirementExpenses: budget.retirementExpenses,
        savingsRate: savings.savingsRate,
        hasIncome: savings.hasIncome,
        topAssetShare: allocation.fireTopPercent,
        hasNegativeAmortisation: totals.debts.some(
          (d) => d.balance > 0 && d.annualPayment < d.balance * d.interestRate,
        ),
        hasExcludedDebt: totals.hasExcludedDebt,
      }),
    [settings, afterTax, budget, savings, allocation, totals],
  );
};

/** How the plan is tracking against reality, from recorded snapshots. */
export const usePlanTracking = () => {
  const snapshots = useHistory((s) => s.snapshots);
  const contributions = usePlanContributions();
  const expectedReturn = useAfterTaxReturn();
  const budget = usePlanBudget();
  const totals = usePortfolioTotals();
  const settings = useSettings((s) => s.settings);

  return useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];

    if (!first) return { comparison: null, attribution: null };

    // Anchor the projection at the first snapshot, so the comparison asks
    // whether reality matched the plan rather than comparing today to today.
    const fromFirst = buildProjection(
      {
        currentNetWorth: first.netWorth,
        monthlySavings: contributions.monthlyContributions,
        expectedReturn,
        retirementAge: settings.retirementAge,
        annualExpenses: budget.annualExpenses,
        retirementExpenses: budget.retirementExpenses,
        currentLockedNetWorth: totals.fireLockedAssetsTotal,
        monthlyLockedSavings: contributions.monthlyLockedContributions,
      },
      settings,
      DASHBOARD_HORIZON_YEARS,
    );

    return {
      comparison: comparePlan(sorted, fromFirst),
      attribution: attributeGrowth(sorted, contributions.monthlyContributions),
    };
  }, [snapshots, contributions, expectedReturn, budget, totals, settings]);
};
