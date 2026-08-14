import type { AssetType } from "@/types";

/**
 * New Zealand tax rules, as at the **2025/26 income year**.
 *
 * Rates and thresholds change most years, usually at 1 April. Everything the
 * IRD can move lives in this one block so it can be checked in one place —
 * verify against ird.govt.nz before relying on a projection for a real
 * decision, and update `TAX_YEAR` when you do.
 */
export const TAX_YEAR = "2025/26";

/** Progressive PAYE bands. `upTo` is the top of the band; Infinity is the top rate. */
export const PAYE_BANDS: ReadonlyArray<{ upTo: number; rate: number }> = [
  { upTo: 15_600, rate: 0.105 },
  { upTo: 53_500, rate: 0.175 },
  { upTo: 78_100, rate: 0.3 },
  { upTo: 180_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

/** ACC earner levy, charged on salary and wages up to a cap. */
export const ACC_EARNER_LEVY_RATE = 0.0167;
export const ACC_MAX_LIABLE_EARNINGS = 152_790;

/**
 * Prescribed Investor Rate bands for PIE funds (KiwiSaver and most NZ retail
 * funds). The real test uses the lower of the previous two income years; this
 * uses current income, which is close enough for a projection.
 */
export const PIR_BANDS: ReadonlyArray<{
  taxableUpTo: number;
  combinedUpTo: number;
  rate: number;
}> = [
  { taxableUpTo: 15_600, combinedUpTo: 53_500, rate: 0.105 },
  { taxableUpTo: 53_500, combinedUpTo: 78_100, rate: 0.175 },
];
export const PIR_TOP_RATE = 0.28;

/**
 * Foreign Investment Fund rules. Above the threshold (measured on cost, not
 * market value) the Fair Dividend Rate deems 5% of opening value to be income
 * each year, regardless of what the investment actually returned.
 */
export const FIF_COST_THRESHOLD_NZD = 50_000;
export const FAIR_DIVIDEND_RATE = 0.05;

/** Employer Superannuation Contribution Tax bands, on salary + employer contributions. */
export const ESCT_BANDS: ReadonlyArray<{ upTo: number; rate: number }> = [
  { upTo: 16_800, rate: 0.105 },
  { upTo: 57_600, rate: 0.175 },
  { upTo: 84_000, rate: 0.3 },
  { upTo: 216_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

/** Minimum employee and employer KiwiSaver contribution rates. */
export const KIWISAVER_EMPLOYEE_RATES = [0.03, 0.04, 0.06, 0.08, 0.1];
export const DEFAULT_EMPLOYER_KIWISAVER_RATE = 0.03;

/**
 * Government contribution: 25c per $1 contributed, to an annual maximum, and
 * only for members earning under the income cap.
 *
 * Budget 2025 halved this from $521.43 and introduced the income cap. Worth
 * re-checking — it is the figure most likely to have moved again.
 */
export const GOVT_CONTRIBUTION_MATCH = 0.25;
export const GOVT_CONTRIBUTION_MAX = 260.72;
export const GOVT_CONTRIBUTION_INCOME_CAP = 180_000;

/** Income tax payable on `income`, excluding the ACC earner levy. */
export const payeTax = (income: number): number => {
  if (income <= 0) return 0;

  let tax = 0;
  let previousCeiling = 0;

  for (const band of PAYE_BANDS) {
    if (income <= previousCeiling) break;

    const taxableInBand = Math.min(income, band.upTo) - previousCeiling;

    tax += taxableInBand * band.rate;
    previousCeiling = band.upTo;
  }

  return tax;
};

/** ACC earner levy on salary and wages, capped at the maximum liable earnings. */
export const accLevy = (salaryIncome: number): number => {
  if (salaryIncome <= 0) return 0;

  return Math.min(salaryIncome, ACC_MAX_LIABLE_EARNINGS) * ACC_EARNER_LEVY_RATE;
};

/** The rate applied to one more dollar of income. */
export const marginalRate = (income: number): number => {
  for (const band of PAYE_BANDS) {
    if (income <= band.upTo) return band.rate;
  }

  return PAYE_BANDS[PAYE_BANDS.length - 1].rate;
};

/** PIR for a member, given their taxable income and PIE income. */
export const prescribedInvestorRate = (
  taxableIncome: number,
  pieIncome = 0,
): number => {
  for (const band of PIR_BANDS) {
    if (
      taxableIncome <= band.taxableUpTo &&
      taxableIncome + pieIncome <= band.combinedUpTo
    ) {
      return band.rate;
    }
  }

  return PIR_TOP_RATE;
};

/** ESCT rate applied to employer KiwiSaver contributions. */
export const esctRate = (salaryPlusEmployerContributions: number): number => {
  for (const band of ESCT_BANDS) {
    if (salaryPlusEmployerContributions <= band.upTo) return band.rate;
  }

  return ESCT_BANDS[ESCT_BANDS.length - 1].rate;
};

/** Annual government contribution earned by a member's own contributions. */
export const governmentContribution = (
  memberContributions: number,
  totalIncome: number,
): number => {
  if (totalIncome >= GOVT_CONTRIBUTION_INCOME_CAP) return 0;
  if (memberContributions <= 0) return 0;

  return Math.min(
    memberContributions * GOVT_CONTRIBUTION_MATCH,
    GOVT_CONTRIBUTION_MAX,
  );
};

export interface InvestmentTaxRates {
  /** Marginal income tax rate, for interest and crypto. */
  marginal: number;
  /** Prescribed Investor Rate, for PIE funds and KiwiSaver. */
  pir: number;
}

/**
 * Annual return after investment tax, for one asset class.
 *
 * New Zealand has no general capital gains tax, so what gets taxed depends
 * heavily on *what* you hold:
 *
 * - **Savings** — interest is income, taxed in full at your marginal rate.
 * - **KiwiSaver and shares** — assumed to be held through PIE funds, where
 *   Fair Dividend Rate deems 5% of value to be income each year and taxes it
 *   at your PIR. Note this is a flat drag: it applies whether the fund went up
 *   or down, so a bad year is taxed just the same.
 * - **Property** — capital growth is untaxed outside the bright-line period.
 *   Rental income is modelled separately as an income source.
 * - **Crypto** — IRD treats disposal gains as income for most holders, so the
 *   whole return is taxed at the marginal rate.
 * - **Other** — left untaxed; too unspecified to guess.
 */
export const afterTaxReturn = (
  assetType: AssetType,
  nominalReturn: number,
  rates: InvestmentTaxRates,
): number => {
  switch (assetType) {
    case "savings":
    case "crypto":
      return nominalReturn * (1 - rates.marginal);
    case "kiwisaver":
    case "shares":
      // FDR taxes 5% of value, not the actual return.
      return nominalReturn - rates.pir * FAIR_DIVIDEND_RATE;
    case "property":
    case "other":
    default:
      return nominalReturn;
  }
};

export interface AssetWeight {
  type: AssetType;
  value: number;
}

/**
 * Portfolio-weighted after-tax return. Falls back to the pre-tax return when
 * there's nothing to weight by.
 */
export const blendedAfterTaxReturn = (
  weights: AssetWeight[],
  nominalReturn: number,
  rates: InvestmentTaxRates,
): number => {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w.value), 0);

  if (total <= 0) return nominalReturn;

  return weights.reduce(
    (sum, w) =>
      sum +
      (Math.max(0, w.value) / total) *
        afterTaxReturn(w.type, nominalReturn, rates),
    0,
  );
};
