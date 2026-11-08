import type { Currency } from "@/types";
import type { NetWorthSnapshot } from "@/store/history";
import type { Exclusions, PotReading } from "@/domain/tracking";

import { startOfYear, subMonths } from "date-fns";

import {
  contributionFlows,
  MS_PER_YEAR,
  NOTHING_EXCLUDED,
  readPots,
  solveReturn,
  yearsBetween,
} from "@/domain/tracking";

/** Daily closes of an index, with what it takes to read it in NZD. */
export interface BenchmarkSeries {
  /** ISO days, ascending. */
  dates: string[];
  /** Index level in USD, dividends reinvested. */
  usd: number[];
  /** NZD per USD on the same days. */
  usdToNzd: number[];
}

const MINIMUM_YEARS = 30 / 365.25;
/** A record can run this far past the last close before it stops being fair. */
const MAX_DAYS_PAST_DATA = 7;

const dayOf = (iso: string): string => iso.slice(0, 10);

/** Position of the last close on or before a day, -1 when before them all. */
const closeIndex = (dates: string[], day: string): number => {
  let low = 0;
  let high = dates.length - 1;
  let found = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;

    if (dates[mid] <= day) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return found;
};

/**
 * The index level on a day, as an investor holding that currency sees it. In
 * NZD this includes the exchange rate moving, which an unhedged New Zealand
 * investor really does bear.
 */
export const levelOn = (
  series: BenchmarkSeries,
  currency: Currency,
  iso: string,
): number | null => {
  const i = closeIndex(series.dates, dayOf(iso));

  if (i < 0) return null;

  return currency === "USD"
    ? series.usd[i]
    : series.usd[i] * series.usdToNzd[i];
};

/** One reading along the record, in the record's currency. */
export interface BenchmarkPathPoint {
  date: string;
  /** What the pot's assets were worth. */
  actual: number;
  /** What the same money would have been worth in the index. */
  benchmark: number;
  /** The starting value plus everything paid in so far. */
  paidIn: number;
}

export interface BenchmarkComparison {
  from: string;
  to: string;
  years: number;
  /** Annualised money-weighted return on the pot's assets. */
  annualised: number;
  /** The same measure had every dollar gone into the index instead. */
  benchmarkAnnualised: number;
  /** Your rate less the index's. Positive means ahead. */
  gap: number;
  /** What the pot's assets are worth at the end of the window. */
  actual: number;
  /** What the same money would be worth in the index. */
  benchmark: number;
  /** Positive means you hold more than the index would have given you. */
  difference: number;
  path: BenchmarkPathPoint[];
}

/**
 * Run a stretch of the record through the index: the same starting value and
 * the same contributions on the same dates, buying index units instead.
 * Because the money matches exactly, the only difference left is what it was
 * invested in. Null when the stretch is too short or its return unbelievable.
 */
const compareStretch = (
  readings: PotReading[],
  monthlyContributions: number,
  series: BenchmarkSeries,
  currency: Currency,
): BenchmarkComparison | null => {
  if (readings.length < 2) return null;

  const first = readings[0];
  const last = readings[readings.length - 1];
  const years = yearsBetween(first.date, last.date);

  if (years < MINIMUM_YEARS || first.assets <= 0) return null;

  const startLevel = levelOn(series, currency, first.date);

  if (startLevel === null) return null;

  const flows = contributionFlows(readings, monthlyContributions);
  const startMs = Date.parse(first.date);
  const flowDate = (at: number) =>
    new Date(startMs + at * MS_PER_YEAR).toISOString();

  let units = first.assets / startLevel;
  let paidIn = first.assets;
  let next = 0;

  const path: BenchmarkPathPoint[] = [];

  for (const reading of readings) {
    const elapsed = yearsBetween(first.date, reading.date);

    while (next < flows.length && flows[next].at <= elapsed) {
      const level = levelOn(series, currency, flowDate(flows[next].at));

      if (level === null) return null;
      units += flows[next].amount / level;
      paidIn += flows[next].amount;
      next += 1;
    }

    const level = levelOn(series, currency, reading.date);

    if (level === null) return null;
    path.push({
      date: reading.date,
      actual: reading.assets,
      benchmark: units * level,
      paidIn,
    });
  }

  const end = path[path.length - 1];
  const annualised = solveReturn(first.assets, flows, years, end.actual);
  const benchmarkAnnualised = solveReturn(
    first.assets,
    flows,
    years,
    end.benchmark,
  );

  if (annualised === null || benchmarkAnnualised === null) return null;

  return {
    from: first.date,
    to: last.date,
    years,
    annualised,
    benchmarkAnnualised,
    gap: annualised - benchmarkAnnualised,
    actual: end.actual,
    benchmark: end.benchmark,
    difference: end.actual - end.benchmark,
    path,
  };
};

/** The readings the index can speak for: inside its data, give or take. */
const readingsCovered = (
  readings: PotReading[],
  series: BenchmarkSeries,
): PotReading[] => {
  if (series.dates.length === 0) return [];

  const lastClose = Date.parse(series.dates[series.dates.length - 1]);
  const limit = lastClose + (MAX_DAYS_PAST_DATA + 1) * 24 * 60 * 60 * 1000;

  return readings.filter(
    (r) => dayOf(r.date) >= series.dates[0] && Date.parse(r.date) < limit,
  );
};

export interface PerformancePeriod extends BenchmarkComparison {
  label: string;
  /** Your return across the period, not annualised. */
  periodReturn: number;
  /** The index's return across the period, not annualised. */
  benchmarkPeriodReturn: number;
}

export interface Performance {
  /** The whole record that the index covers. */
  overall: BenchmarkComparison;
  /** Newest-relevant first: since you started, recent windows, then years. */
  periods: PerformancePeriod[];
  /** Currency the index is measured in. */
  currency: Currency;
  /** The last close available. */
  dataThrough: string;
}

interface PeriodWindow {
  label: string;
  from: Date;
  until: Date;
  /** Calendar years may start at the first reading; rolling windows may not. */
  allowLateStart: boolean;
}

const periodWindows = (firstReading: string, now: Date): PeriodWindow[] => {
  const thisYear = now.getFullYear();
  const firstYear = new Date(firstReading).getFullYear();
  const windows: PeriodWindow[] = [
    {
      label: "Last 3 months",
      from: subMonths(now, 3),
      until: now,
      allowLateStart: false,
    },
    {
      label: "Last 12 months",
      from: subMonths(now, 12),
      until: now,
      allowLateStart: false,
    },
  ];

  for (let year = thisYear; year >= firstYear; year--) {
    const from = startOfYear(new Date(year, 0, 1));

    windows.push({
      label: year === thisYear ? "This year" : String(year),
      from,
      until: year === thisYear ? now : startOfYear(new Date(year + 1, 0, 1)),
      allowLateStart: true,
    });
  }

  return windows;
};

/** The readings a window spans, starting from the last one at or before it. */
const sliceWindow = (
  readings: PotReading[],
  window: PeriodWindow,
): PotReading[] | null => {
  const from = window.from.getTime();
  const until = window.until.getTime();
  const at = (r: PotReading) => Date.parse(r.date);

  let start = -1;

  for (let i = 0; i < readings.length && at(readings[i]) <= from; i++) {
    start = i;
  }

  if (start < 0) {
    if (!window.allowLateStart) return null;
    start = 0;
  }

  let end = start;

  for (let i = start; i < readings.length && at(readings[i]) <= until; i++) {
    end = i;
  }

  return readings.slice(start, end + 1);
};

/**
 * How the pot has done against the index, across the whole record and over
 * standard periods. Null until there is a long enough stretch to compare.
 *
 * `currency` is the one the record is really held in, so flipping the display
 * currency can't change a return.
 */
export const measurePerformance = (
  snapshots: NetWorthSnapshot[],
  monthlyContributions: number,
  series: BenchmarkSeries,
  currency: Currency,
  excluded: Exclusions = NOTHING_EXCLUDED,
  now: Date = new Date(),
): Performance | null => {
  const readings = readingsCovered(readPots(snapshots, excluded), series);
  const overall = compareStretch(
    readings,
    monthlyContributions,
    series,
    currency,
  );

  if (!overall) return null;

  const toPeriod = (
    comparison: BenchmarkComparison,
    label: string,
  ): PerformancePeriod => ({
    ...comparison,
    label,
    periodReturn: Math.pow(1 + comparison.annualised, comparison.years) - 1,
    benchmarkPeriodReturn:
      Math.pow(1 + comparison.benchmarkAnnualised, comparison.years) - 1,
  });

  const periods = [toPeriod(overall, "Since you started")];
  const seen = new Set([`${overall.from}|${overall.to}`]);

  for (const window of periodWindows(readings[0].date, now)) {
    const slice = sliceWindow(readings, window);

    if (!slice) continue;

    const comparison = compareStretch(
      slice,
      monthlyContributions,
      series,
      currency,
    );

    if (!comparison) continue;

    // A young record makes several windows the same stretch: show it once.
    const key = `${comparison.from}|${comparison.to}`;

    if (seen.has(key)) continue;
    seen.add(key);
    periods.push(toPeriod(comparison, window.label));
  }

  return {
    overall,
    periods,
    currency,
    dataThrough: series.dates[series.dates.length - 1],
  };
};
