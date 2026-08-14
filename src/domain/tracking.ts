import type { ProjectionPoint } from "@/types";
import type { NetWorthSnapshot } from "@/store/history";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Fractional years between two ISO timestamps. Negative if `to` precedes `from`. */
export const yearsBetween = (from: string, to: string): number =>
  (Date.parse(to) - Date.parse(from)) / MS_PER_YEAR;

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
): PlanComparison | null => {
  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
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
  /** Change in net worth over the tracked window. */
  total: number;
  /** The part explained by money you put in. */
  contributions: number;
  /** The residual — markets, revaluations, debt paydown. */
  market: number;
  /** Share of growth that came from the market rather than contributions. */
  marketShare: number;
  yearsTracked: number;
}

/**
 * Split net worth growth into what you contributed and what the market did.
 *
 * Contributions are estimated by applying the current monthly rate across the
 * window, so a rate that changed partway through will smear. It is an estimate
 * for orientation - "am I growing this myself or is the market carrying me" -
 * not an audit.
 */
export const attributeGrowth = (
  snapshots: NetWorthSnapshot[],
  monthlyContributions: number,
): GrowthAttribution | null => {
  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const yearsTracked = yearsBetween(first.date, last.date);

  if (yearsTracked <= 0) return null;

  const total = last.netWorth - first.netWorth;
  const contributions = monthlyContributions * yearsTracked * 12;
  const market = total - contributions;

  return {
    total,
    contributions,
    market,
    marketShare: total !== 0 ? market / Math.abs(total) : 0,
    yearsTracked,
  };
};
