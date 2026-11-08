import type { AssetMix, AssetType, Currency, Liability } from "@/types";
import type { NetWorthSnapshot } from "@/store/history";
import type { Exclusions, PotReading } from "@/domain/tracking";
import type { InvestmentTaxRates } from "@/domain/tax";

import { startOfYear, subMonths } from "date-fns";

import { convert } from "@/domain/currency";
import { FAIR_DIVIDEND_RATE, taxRuleFor } from "@/domain/tax";
import {
  contributionFlows,
  MS_PER_YEAR,
  NOTHING_EXCLUDED,
  readPots,
  solveReturn,
  yearsBetween,
} from "@/domain/tracking";

/** Everything the record can be measured against, in the order it is listed. */
export const BENCHMARK_IDS = [
  "plan",
  "inflation",
  "global",
  "sp500",
  "mix",
  "mortgage",
  "cash",
] as const;

export type BenchmarkId = (typeof BENCHMARK_IDS)[number];

/**
 * What a unit put in at one moment is worth at another, read as a level on a
 * day. Only ratios of levels mean anything. Null before the level's data.
 */
export type LevelAt = (iso: string) => number | null;

export interface Benchmark {
  id: BenchmarkId;
  levelAt: LevelAt;
}

/** Daily closes of an index, with what it takes to read it in NZD. */
export interface BenchmarkSeries {
  /** ISO days, ascending. */
  dates: string[];
  /** Index level in USD, dividends reinvested. */
  usd: number[];
  /** NZD per USD on the same days. */
  usdToNzd: number[];
}

/** A slower-moving level, such as quarterly prices or a compounded rate. */
export interface GrowthCurve {
  /** ISO days, ascending. */
  dates: string[];
  level: number[];
}

const MINIMUM_YEARS = 30 / 365.25;
/** A record can run this far past the last close before it stops being fair. */
const MAX_DAYS_PAST_DATA = 7;
/** Levels that need a fixed origin count their years from here. */
const EPOCH = "2010-01-01T00:00:00.000Z";

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

export const marketLevel =
  (series: BenchmarkSeries, currency: Currency): LevelAt =>
  (iso) =>
    levelOn(series, currency, iso);

/** A rate that compounds steadily, such as the plan's or a mortgage's. */
export const fixedRateLevel =
  (rate: number): LevelAt =>
  (iso) =>
    Math.pow(1 + rate, yearsBetween(EPOCH, iso));

/**
 * A curve read on any day, straight between its points. Official figures
 * arrive months late, so past the last point it carries on at the pace of its
 * last `trailingPoints` steps rather than pretending prices stopped.
 */
export const curveLevel =
  (curve: GrowthCurve, trailingPoints: number): LevelAt =>
  (iso) => {
    const day = dayOf(iso);
    const i = closeIndex(curve.dates, day);

    if (i < 0) return null;

    const at = (k: number) => Date.parse(curve.dates[k]);
    const now = Date.parse(day);
    const last = curve.dates.length - 1;

    if (i === last) {
      const back = Math.max(0, last - trailingPoints);

      if (back === last || now === at(last)) return curve.level[last];

      const growth = curve.level[last] / curve.level[back];
      const span = (at(last) - at(back)) / MS_PER_YEAR;

      return (
        curve.level[last] *
        Math.pow(growth, (now - at(last)) / MS_PER_YEAR / span)
      );
    }

    const share = (now - at(i)) / (at(i + 1) - at(i));

    return curve.level[i] + (curve.level[i + 1] - curve.level[i]) * share;
  };

/**
 * A level as it would have grown after New Zealand investment tax, following
 * the same rules the plan applies to that asset class: a flat Fair Dividend
 * Rate drag for funds, income tax on the whole return for interest.
 */
const afterTaxLevel = (
  level: LevelAt,
  type: AssetType,
  rates: InvestmentTaxRates,
): LevelAt => {
  switch (taxRuleFor(type)) {
    case "pie": {
      const keep = 1 - rates.pir * FAIR_DIVIDEND_RATE;

      return (iso) => {
        const value = level(iso);

        return value === null
          ? null
          : value * Math.pow(keep, yearsBetween(EPOCH, iso));
      };
    }
    case "income":
      return (iso) => {
        const value = level(iso);

        return value === null ? null : Math.pow(value, 1 - rates.marginal);
      };
    case "untaxed":
      return level;
  }
};

type Leg = "shares" | "cash";

/**
 * What stands in for each kind of holding in the matched mix. KiwiSaver reads
 * as a growth fund. Property, crypto and "other" have no fair index here, so
 * they are left out and the rest of the mix is scaled up to fill the space.
 */
const MIX_LEGS: Partial<Record<AssetType, Partial<Record<Leg, number>>>> = {
  kiwisaver: { shares: 0.8, cash: 0.2 },
  shares: { shares: 1 },
  savings: { cash: 1 },
};

const mixWeights = (mix: AssetMix): Array<[AssetType, number]> => {
  const held = (Object.keys(MIX_LEGS) as AssetType[])
    .map((type): [AssetType, number] => [type, Math.max(0, mix[type] ?? 0)])
    .filter(([, value]) => value > 0);
  const total = held.reduce((sum, [, value]) => sum + value, 0);

  return held.map(([type, value]) => [type, value / total]);
};

/** A day of the record and what the pot held on it, if that was recorded. */
export interface MixPoint {
  date: string;
  mix?: AssetMix;
}

/**
 * Indices held in the proportions you held your investments.
 *
 * Between two snapshots it holds the first one's mix, then rebalances to the
 * next, so the blend follows the pot as it changed. Snapshots from before the
 * mix was recorded use today's. Null when nothing held has an index.
 */
export const mixLevel = (
  history: MixPoint[],
  currentMix: AssetMix,
  legs: Record<Leg, LevelAt>,
  tax: InvestmentTaxRates | null,
): LevelAt | null => {
  const currentWeights = mixWeights(currentMix);

  if (currentWeights.length === 0 || history.length === 0) return null;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((p) => p.date);
  const weights = sorted.map((p) => {
    const recorded = p.mix ? mixWeights(p.mix) : [];

    return recorded.length > 0 ? recorded : currentWeights;
  });
  const levelFor = (type: AssetType, leg: Leg): LevelAt =>
    tax ? afterTaxLevel(legs[leg], type, tax) : legs[leg];
  const levels = new Map(
    (Object.keys(MIX_LEGS) as AssetType[]).map((type) => [
      type,
      (Object.entries(MIX_LEGS[type] ?? {}) as Array<[Leg, number]>).map(
        ([leg, share]) => ({ share, level: levelFor(type, leg) }),
      ),
    ]),
  );

  const growth = (k: number, to: string): number =>
    weights[k].reduce(
      (sum, [type, weight]) =>
        sum +
        weight *
          (levels.get(type) ?? []).reduce((legSum, { share, level }) => {
            const start = level(dates[k]);
            const end = level(to);

            return legSum + share * (start && end ? end / start : 1);
          }, 0),
      0,
    );

  const chain = [1];

  for (let k = 0; k + 1 < dates.length; k++) {
    chain.push(chain[k] * growth(k, dates[k + 1]));
  }

  return (iso) => {
    const k = closeIndex(dates, iso);

    return k < 0 ? null : chain[k] * growth(k, iso);
  };
};

/**
 * The rate on your mortgages, weighted by what is owed on each. Null without
 * one. It is already an after-tax figure: home loan interest isn't deductible,
 * so a dollar not paid in interest is a dollar kept whole.
 */
export const mortgageRateOf = (
  liabilities: Liability[],
  usdToNzd: number,
): number | null => {
  const mortgages = liabilities
    .filter((l) => l.type === "mortgage" && l.balance > 0)
    .map((l) => ({
      owed: convert(l.balance, l.currency, "NZD", usdToNzd),
      rate: l.interestRate,
    }));
  const owed = mortgages.reduce((sum, m) => sum + m.owed, 0);
  const rate =
    owed > 0
      ? mortgages.reduce((sum, m) => sum + m.rate * (m.owed / owed), 0)
      : 0;

  return rate > 0 ? rate : null;
};

export interface BenchmarkInputs {
  sp500: BenchmarkSeries;
  global: BenchmarkSeries;
  /** Consumer prices. */
  cpi: GrowthCurve;
  /** A dollar left at the bank rate. */
  cash: GrowthCurve;
  currency: Currency;
  /** The nominal return the plan assumes, after tax when it models tax. */
  planReturn: number;
  mortgageRate: number | null;
  currentMix: AssetMix;
  snapshots: NetWorthSnapshot[];
  /** Tax to take off the indices, null to read them before tax. */
  tax: InvestmentTaxRates | null;
}

/** How many curve points set the pace once the official figures run out. */
const CPI_TRAILING_QUARTERS = 4;
const CASH_TRAILING_MONTHS = 1;

/** Every benchmark these inputs can support, in listing order. */
export const buildBenchmarks = ({
  sp500,
  global,
  cpi,
  cash,
  currency,
  planReturn,
  mortgageRate,
  currentMix,
  snapshots,
  tax,
}: BenchmarkInputs): Benchmark[] => {
  const shares = (level: LevelAt) =>
    tax ? afterTaxLevel(level, "shares", tax) : level;
  const globalLevel = marketLevel(global, currency);
  const cashLevel = curveLevel(cash, CASH_TRAILING_MONTHS);
  const matched = mixLevel(
    snapshots.map((s) => ({ date: s.date, mix: s.fireAssetsByType })),
    currentMix,
    { shares: globalLevel, cash: cashLevel },
    tax,
  );

  const levels: Record<BenchmarkId, LevelAt | null> = {
    plan: fixedRateLevel(planReturn),
    inflation: curveLevel(cpi, CPI_TRAILING_QUARTERS),
    global: shares(globalLevel),
    sp500: shares(marketLevel(sp500, currency)),
    mix: matched,
    mortgage: mortgageRate === null ? null : fixedRateLevel(mortgageRate),
    cash: tax ? afterTaxLevel(cashLevel, "savings", tax) : cashLevel,
  };

  return BENCHMARK_IDS.flatMap((id) => {
    const levelAt = levels[id];

    return levelAt ? [{ id, levelAt }] : [];
  });
};

/** One reading along the record, in the record's currency. */
export interface BenchmarkPathPoint {
  date: string;
  /** What the pot's assets were worth. */
  actual: number;
  /** The starting value plus everything paid in so far. */
  paidIn: number;
  /** What the same money would have been worth in each benchmark. */
  benchmarks: Partial<Record<BenchmarkId, number>>;
}

/** How one benchmark did with the same money over the same stretch. */
export interface BenchmarkOutcome {
  /** The money-weighted return had every dollar gone here instead. */
  annualised: number;
  /** Your rate less this one's. Positive means ahead. */
  gap: number;
  /** Its return across the stretch, not annualised. */
  periodReturn: number;
  /** What the same money would be worth at the end. */
  value: number;
  /** Positive means you hold more than this would have given you. */
  difference: number;
}

export interface BenchmarkComparison {
  from: string;
  to: string;
  years: number;
  /** Annualised money-weighted return on the pot's assets. */
  annualised: number;
  /** The pot's return across the stretch, not annualised. */
  periodReturn: number;
  /** What the pot's assets are worth at the end of the window. */
  actual: number;
  /** The starting value plus everything paid in. */
  paidIn: number;
  /** Benchmarks with data across the whole stretch. */
  outcomes: Partial<Record<BenchmarkId, BenchmarkOutcome>>;
  path: BenchmarkPathPoint[];
}

const compound = (annualised: number, years: number): number =>
  Math.pow(1 + annualised, years) - 1;

/**
 * Run a stretch of the record through every benchmark: the same starting value
 * and the same contributions on the same dates, buying benchmark units
 * instead. Because the money matches exactly, the only difference left is what
 * it was invested in. Null when the stretch is too short or its return
 * unbelievable; a benchmark without data for the stretch is simply absent.
 */
const compareStretch = (
  readings: PotReading[],
  monthlyContributions: number,
  benchmarks: Benchmark[],
): BenchmarkComparison | null => {
  if (readings.length < 2) return null;

  const first = readings[0];
  const last = readings[readings.length - 1];
  const years = yearsBetween(first.date, last.date);

  if (years < MINIMUM_YEARS || first.assets <= 0) return null;

  const flows = contributionFlows(readings, monthlyContributions);
  const annualised = solveReturn(first.assets, flows, years, last.assets);

  if (annualised === null) return null;

  const startMs = Date.parse(first.date);
  const flowDate = (at: number) =>
    new Date(startMs + at * MS_PER_YEAR).toISOString();

  const path: BenchmarkPathPoint[] = [];
  let paidIn = first.assets;
  let nextFlow = 0;

  for (const reading of readings) {
    const elapsed = yearsBetween(first.date, reading.date);

    while (nextFlow < flows.length && flows[nextFlow].at <= elapsed) {
      paidIn += flows[nextFlow].amount;
      nextFlow += 1;
    }

    path.push({
      date: reading.date,
      actual: reading.assets,
      paidIn,
      benchmarks: {},
    });
  }

  const outcomes: BenchmarkComparison["outcomes"] = {};

  for (const { id, levelAt } of benchmarks) {
    const startLevel = levelAt(first.date);

    if (!startLevel) continue;

    const values: number[] = [];
    let units = first.assets / startLevel;
    let next = 0;
    let covered = true;

    for (const reading of readings) {
      const elapsed = yearsBetween(first.date, reading.date);

      while (covered && next < flows.length && flows[next].at <= elapsed) {
        const level = levelAt(flowDate(flows[next].at));

        if (level) units += flows[next].amount / level;
        else covered = false;
        next += 1;
      }

      const level = levelAt(reading.date);

      if (!covered || !level) {
        covered = false;
        break;
      }
      values.push(units * level);
    }

    if (!covered) continue;

    const value = values[values.length - 1];
    const rate = solveReturn(first.assets, flows, years, value);

    if (rate === null) continue;

    values.forEach((v, i) => {
      path[i].benchmarks[id] = v;
    });
    outcomes[id] = {
      annualised: rate,
      gap: annualised - rate,
      periodReturn: compound(rate, years),
      value,
      difference: last.assets - value,
    };
  }

  return {
    from: first.date,
    to: last.date,
    years,
    annualised,
    periodReturn: compound(annualised, years),
    actual: last.assets,
    paidIn,
    outcomes,
    path,
  };
};

/** The readings the markets can speak for: inside their data, give or take. */
const readingsCovered = (
  readings: PotReading[],
  marketDates: string[],
): PotReading[] => {
  if (marketDates.length === 0) return [];

  const lastClose = Date.parse(marketDates[marketDates.length - 1]);
  const limit = lastClose + (MAX_DAYS_PAST_DATA + 1) * 24 * 60 * 60 * 1000;

  return readings.filter(
    (r) => dayOf(r.date) >= marketDates[0] && Date.parse(r.date) < limit,
  );
};

export interface PerformancePeriod extends BenchmarkComparison {
  label: string;
}

export interface Performance {
  /** The whole record that the markets cover. */
  overall: BenchmarkComparison;
  /** Newest-relevant first: since you started, recent windows, then years. */
  periods: PerformancePeriod[];
  /** The last market close available. */
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

export interface MeasureInputs {
  snapshots: NetWorthSnapshot[];
  monthlyContributions: number;
  benchmarks: Benchmark[];
  /** Trading days the market data covers; the record is read inside them. */
  marketDates: string[];
  excluded?: Exclusions;
  now?: Date;
}

/**
 * How the pot has done against each benchmark, across the whole record and
 * over standard periods. Null until there is a long enough stretch to compare.
 */
export const measurePerformance = ({
  snapshots,
  monthlyContributions,
  benchmarks,
  marketDates,
  excluded = NOTHING_EXCLUDED,
  now = new Date(),
}: MeasureInputs): Performance | null => {
  const readings = readingsCovered(readPots(snapshots, excluded), marketDates);
  const overall = compareStretch(readings, monthlyContributions, benchmarks);

  if (!overall) return null;

  const periods: PerformancePeriod[] = [
    { ...overall, label: "Since you started" },
  ];
  const seen = new Set([`${overall.from}|${overall.to}`]);

  for (const window of periodWindows(readings[0].date, now)) {
    const slice = sliceWindow(readings, window);

    if (!slice) continue;

    const comparison = compareStretch(slice, monthlyContributions, benchmarks);

    if (!comparison) continue;

    // A young record makes several windows the same stretch: show it once.
    const key = `${comparison.from}|${comparison.to}`;

    if (seen.has(key)) continue;
    seen.add(key);
    periods.push({ ...comparison, label: window.label });
  }

  return {
    overall,
    periods,
    dataThrough: marketDates[marketDates.length - 1],
  };
};
