import type { AssetMix, Currency, ProjectionPoint } from "@/types";
import type { NetWorthSnapshot } from "@/store/history";

import { convert } from "@/domain/currency";

export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Fractional years between two ISO timestamps. Negative if `to` precedes `from`. */
export const yearsBetween = (from: string, to: string): number =>
  (Date.parse(to) - Date.parse(from)) / MS_PER_YEAR;

/**
 * What today's portfolio keeps out of the FIRE pot, in display currency. Used
 * to place older snapshots, which only recorded total net worth, on the pot's
 * basis: the excluded home and its mortgage are assumed to have been there
 * all along at today's figures. Exact once a snapshot carries the pot itself.
 */
export interface Exclusions {
  assets: number;
  liabilities: number;
}

export const NOTHING_EXCLUDED: Exclusions = { assets: 0, liabilities: 0 };

/**
 * Put a record into one currency at today's rate.
 *
 * Each snapshot is stored in whatever currency was on display that day, so a
 * record can hold both. Left mixed, the switch itself reads as a huge gain or
 * loss. One rate across the whole record leaves every return untouched.
 */
export const inCurrency = (
  snapshots: NetWorthSnapshot[],
  to: Currency,
  usdToNzd: number,
): NetWorthSnapshot[] =>
  snapshots.map((s) => {
    if (s.currency === to) return s;

    const move = (amount: number) => convert(amount, s.currency, to, usdToNzd);
    const moveMaybe = (amount?: number) =>
      amount === undefined ? undefined : move(amount);

    return {
      ...s,
      currency: to,
      netWorth: move(s.netWorth),
      assetsTotal: move(s.assetsTotal),
      liabilitiesTotal: move(s.liabilitiesTotal),
      fireNetWorth: moveMaybe(s.fireNetWorth),
      fireAssetsTotal: moveMaybe(s.fireAssetsTotal),
      fireAssetsByType:
        s.fireAssetsByType &&
        (Object.fromEntries(
          Object.entries(s.fireAssetsByType).map(([type, value]) => [
            type,
            move(value),
          ]),
        ) as AssetMix),
      monthlyContributions: moveMaybe(s.monthlyContributions),
    };
  });

/** One snapshot read on the basis the plan projects: the FIRE pot. */
export interface PotReading {
  date: string;
  /** The pot: assets funding retirement net of the debts set against them. */
  netWorth: number;
  /** Gross assets in the pot, the base a return is earned on. */
  assets: number;
  /** Debt netted off the pot. */
  debt: number;
  /** Monthly contributions into the pot at the time, when recorded. */
  monthlyContributions?: number;
}

/**
 * Read a snapshot on the pot's basis. A snapshot that recorded the pot is
 * taken as is; an older one is estimated from its totals less what is
 * excluded today.
 */
export const readPot = (
  s: NetWorthSnapshot,
  excluded: Exclusions = NOTHING_EXCLUDED,
): PotReading => {
  const assets =
    s.fireAssetsTotal ?? Math.max(0, s.assetsTotal - excluded.assets);
  const netWorth =
    s.fireNetWorth ?? s.netWorth - (excluded.assets - excluded.liabilities);

  return {
    date: s.date,
    netWorth,
    assets,
    debt: Math.max(0, assets - netWorth),
    monthlyContributions: s.monthlyContributions,
  };
};

export const readPots = (
  snapshots: NetWorthSnapshot[],
  excluded: Exclusions,
): PotReading[] =>
  [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => readPot(s, excluded));

/** Net worth the projection expects at a fractional year offset. */
export const projectedAt = (
  points: ProjectionPoint[],
  year: number,
): number | null => {
  if (points.length === 0) return null;
  if (year <= 0) return points[0].netWorth;

  const last = points[points.length - 1];

  if (year >= last.year) return last.netWorth;

  const lower = Math.floor(year);
  const fraction = year - lower;
  const a = points[lower];
  const b = points[lower + 1];

  if (!a || !b) return null;

  return a.netWorth + (b.netWorth - a.netWorth) * fraction;
};

export interface PlanComparison {
  /** What the plan, anchored at the first snapshot, expected by now. */
  expected: number;
  /** The most recent recorded net worth. */
  actual: number;
  /** Positive means ahead of plan. */
  delta: number;
  /** How far the actual is off, as a share of expected. */
  deltaPercent: number;
  /** Years of tracking the comparison covers. */
  yearsTracked: number;
}

/**
 * Compare where you actually are against where the plan said you'd be.
 *
 * The projection is anchored at the *first* snapshot rather than today, so it
 * answers "has reality matched the plan since I started tracking" rather than
 * the tautology of comparing today's net worth to a projection that starts
 * from today's net worth.
 *
 * Returns null until there are two snapshots far enough apart to say anything.
 */
export const comparePlan = (
  snapshots: NetWorthSnapshot[],
  projectionFromFirst: ProjectionPoint[],
  minimumYears = 30 / 365.25,
  excluded: Exclusions = NOTHING_EXCLUDED,
): PlanComparison | null => {
  if (snapshots.length < 2) return null;

  const sorted = readPots(snapshots, excluded);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const yearsTracked = yearsBetween(first.date, last.date);

  if (yearsTracked < minimumYears) return null;

  const expected = projectedAt(projectionFromFirst, yearsTracked);

  if (expected === null) return null;

  const delta = last.netWorth - expected;

  return {
    expected,
    actual: last.netWorth,
    delta,
    deltaPercent: expected !== 0 ? delta / Math.abs(expected) : 0,
    yearsTracked,
  };
};

export interface GrowthAttribution {
  /** Change in the pot over the tracked window. */
  total: number;
  /** The part explained by money you put in. */
  contributions: number;
  /** The residual — markets, revaluations, debt paydown. */
  market: number;
  /** Share of growth that came from the market rather than contributions. */
  marketShare: number;
  yearsTracked: number;
}

/** A sum of money arriving at a moment, measured in years from the start. */
export interface Flow {
  at: number;
  amount: number;
}

/**
 * The contributions that flowed in across a record, as dated lumps.
 *
 * Each stretch between two snapshots uses the rate recorded at its start, and
 * `fallbackMonthly` (today's rate) where none was recorded. A stretch is cut
 * into monthly lumps placed at the middle of each month, close enough to the
 * fortnightly and monthly reality to compound honestly.
 */
export const contributionFlows = (
  readings: PotReading[],
  fallbackMonthly: number,
): Flow[] => {
  const flows: Flow[] = [];
  const start = readings[0].date;

  for (let k = 0; k + 1 < readings.length; k++) {
    const from = readings[k];
    const years = yearsBetween(from.date, readings[k + 1].date);

    if (years <= 0) continue;

    const monthly = Math.max(0, from.monthlyContributions ?? fallbackMonthly);
    const months = years * 12;
    const steps = Math.max(1, Math.ceil(months));
    const offset = yearsBetween(start, from.date);

    for (let j = 0; j < steps; j++) {
      flows.push({
        at: offset + ((j + 0.5) / steps) * years,
        amount: (monthly * months) / steps,
      });
    }
  }

  return flows;
};

const sumFlows = (flows: Flow[]): number =>
  flows.reduce((sum, f) => sum + f.amount, 0);

/**
 * Split the pot's growth into what you contributed and what the market did.
 *
 * Contributions follow the rate recorded on each snapshot, so a rate that
 * changed partway through is honoured from the snapshot that saw it. Older
 * snapshots without a rate fall back to today's. It is an estimate for
 * orientation - "am I growing this myself or is the market carrying me" -
 * not an audit.
 */
export const attributeGrowth = (
  snapshots: NetWorthSnapshot[],
  monthlyContributions: number,
  excluded: Exclusions = NOTHING_EXCLUDED,
): GrowthAttribution | null => {
  if (snapshots.length < 2) return null;

  const sorted = readPots(snapshots, excluded);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const yearsTracked = yearsBetween(first.date, last.date);

  if (yearsTracked <= 0) return null;

  const total = last.netWorth - first.netWorth;
  const contributions = sumFlows(
    contributionFlows(sorted, monthlyContributions),
  );
  const market = total - contributions;

  return {
    total,
    contributions,
    market,
    marketShare: total !== 0 ? market / Math.abs(total) : 0,
    yearsTracked,
  };
};

export interface ReturnEstimate {
  /** Annualised money-weighted return earned on the pot's assets. */
  annualised: number;
  /** What the assets were worth at the start of the window. */
  startValue: number;
  /** What they are worth at the end. */
  endValue: number;
  /** Money put in across the window. */
  contributions: number;
  /** Growth not explained by contributions: what the money earned. */
  gain: number;
  yearsTracked: number;
}

/** Widest annual return the solver will report; beyond it the data is wrong. */
const RETURN_FLOOR = -0.95;
const RETURN_CEILING = 5;

/**
 * The annual rate at which a starting value plus dated flows, each compounded
 * from when it arrived, grow into a closing value: the money-weighted return.
 * Null when no believable rate does it.
 */
export const solveReturn = (
  startValue: number,
  flows: Flow[],
  years: number,
  endValue: number,
): number | null => {
  // Closing value implied by a rate, less the value recorded. Rises with the
  // rate, so the root can be bracketed and bisected.
  const shortfall = (rate: number): number => {
    const grow = (amount: number, span: number) =>
      amount * Math.pow(1 + rate, span);
    const grownFlows = flows.reduce(
      (sum, f) => sum + grow(f.amount, years - f.at),
      0,
    );

    return grow(startValue, years) + grownFlows - endValue;
  };

  if (shortfall(RETURN_FLOOR) > 0 || shortfall(RETURN_CEILING) < 0) {
    return null;
  }

  let low = RETURN_FLOOR;
  let high = RETURN_CEILING;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;

    if (shortfall(mid) > 0) high = mid;
    else low = mid;
  }

  return (low + high) / 2;
};

/**
 * The return the pot's assets actually earned, as one annual rate.
 *
 * Solves for the rate at which the starting assets plus every contribution,
 * each compounded from the month it arrived, grow into the closing assets.
 * This is the money-weighted return, the same thing a fund's "annualised
 * return since you joined" means, and it is the figure the plan's expected
 * return should be read against.
 *
 * Assets rather than net worth, because a return is earned on what you hold:
 * paying down a loan lifts net worth without the market doing anything.
 *
 * Returns null until two snapshots sit far enough apart to say anything, or
 * when the window implies a rate no portfolio produces, which means a holding
 * was added or revalued rather than earned.
 */
export const estimateReturn = (
  snapshots: NetWorthSnapshot[],
  monthlyContributions: number,
  minimumYears = 30 / 365.25,
  excluded: Exclusions = NOTHING_EXCLUDED,
): ReturnEstimate | null => {
  if (snapshots.length < 2) return null;

  const sorted = readPots(snapshots, excluded);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const yearsTracked = yearsBetween(first.date, last.date);

  if (yearsTracked < minimumYears || first.assets <= 0) return null;

  const flows = contributionFlows(sorted, monthlyContributions);
  const contributions = sumFlows(flows);
  const startValue = first.assets;
  const endValue = last.assets;

  const annualised = solveReturn(startValue, flows, yearsTracked, endValue);

  if (annualised === null) return null;

  return {
    annualised,
    startValue,
    endValue,
    contributions,
    gain: endValue - startValue - contributions,
    yearsTracked,
  };
};
