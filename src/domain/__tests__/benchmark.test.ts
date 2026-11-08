import type { NetWorthSnapshot } from "@/store/history";
import type { Exclusions } from "../tracking";
import type { Benchmark, BenchmarkSeries, GrowthCurve } from "../benchmark";
import type { Currency, Liability } from "@/types";

import { describe, expect, it } from "vitest";

import {
  buildBenchmarks,
  curveLevel,
  fixedRateLevel,
  levelOn,
  marketLevel,
  measurePerformance,
  mixLevel,
  mortgageRateOf,
} from "../benchmark";
import { estimateReturn, inCurrency } from "../tracking";

const snap = (
  date: string,
  assets: number,
  monthlyContributions = 0,
): NetWorthSnapshot => ({
  id: date,
  date: `${date}T00:00:00.000Z`,
  netWorth: assets,
  assetsTotal: assets,
  liabilitiesTotal: 0,
  currency: "NZD",
  monthlyContributions,
});

/** Daily closes growing at a steady annual rate, with a constant FX rate. */
const steadySeries = (
  from: string,
  days: number,
  annual: number,
  usdToNzd = 1.6,
): BenchmarkSeries => {
  const start = Date.parse(from);
  const dates: string[] = [];
  const usd: number[] = [];

  for (let d = 0; d < days; d++) {
    dates.push(new Date(start + d * 86_400_000).toISOString().slice(0, 10));
    usd.push(100 * Math.pow(1 + annual, d / 365.25));
  }

  return { dates, usd, usdToNzd: dates.map(() => usdToNzd) };
};

const NOW = new Date("2026-06-30T12:00:00Z");

const measure = (
  snapshots: NetWorthSnapshot[],
  monthlyContributions: number,
  index: BenchmarkSeries,
  currency: Currency,
  excluded?: Exclusions,
  now?: Date,
) =>
  measurePerformance({
    snapshots,
    monthlyContributions,
    benchmarks: [{ id: "sp500", levelAt: marketLevel(index, currency) }],
    marketDates: index.dates,
    excluded,
    now,
  });

const series = steadySeries("2023-01-01", 1400, 0.1);

describe("levelOn", () => {
  const small: BenchmarkSeries = {
    dates: ["2026-01-02", "2026-01-05"],
    usd: [100, 110],
    usdToNzd: [1.5, 2],
  };

  it("carries the last close across days with no trading", () => {
    expect(levelOn(small, "USD", "2026-01-04T10:00:00Z")).toBe(100);
  });

  it("is null before the data begins", () => {
    expect(levelOn(small, "USD", "2026-01-01T10:00:00Z")).toBeNull();
  });

  it("includes the exchange rate when read in NZD", () => {
    expect(levelOn(small, "NZD", "2026-01-05T10:00:00Z")).toBe(220);
  });
});

describe("measurePerformance", () => {
  it("is null with too little record to compare", () => {
    expect(measure([snap("2026-06-20", 100)], 0, series, "NZD")).toBeNull();
    expect(
      measure(
        [snap("2026-06-20", 100), snap("2026-06-25", 101)],
        0,
        series,
        "NZD",
      ),
    ).toBeNull();
  });

  it("recovers the index's own rate for a pot that matched it", () => {
    const result = measure(
      [snap("2024-01-01", 100_000), snap("2026-01-01", 121_000)],
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.outcomes.sp500!.annualised).toBeCloseTo(0.1, 2);
    expect(result.overall.annualised).toBeCloseTo(0.1, 2);
    expect(result.overall.outcomes.sp500!.gap).toBeCloseTo(0, 2);
    expect(result.overall.outcomes.sp500!.value).toBeCloseTo(121_000, -3);
  });

  it("reports a positive gap when the pot beats the index", () => {
    const result = measure(
      [snap("2024-01-01", 100_000), snap("2026-01-01", 144_000)],
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.annualised).toBeCloseTo(0.2, 2);
    expect(result.overall.outcomes.sp500!.gap).toBeCloseTo(0.1, 2);
    expect(result.overall.outcomes.sp500!.difference).toBeGreaterThan(20_000);
  });

  it("gives the index the same contributions on the same dates", () => {
    const result = measure(
      [snap("2025-01-01", 100_000, 1_000), snap("2026-01-01", 122_600, 1_000)],
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;
    const last = result.overall.path[result.overall.path.length - 1];

    expect(last.paidIn).toBeCloseTo(112_000, -2);
    // 100k grown a year plus 12k, each lump grown about half a year.
    expect(last.benchmarks.sp500).toBeCloseTo(110_000 + 12_000 * 1.0488, -2);
    expect(result.overall.outcomes.sp500!.annualised).toBeCloseTo(0.1, 2);
  });

  it("agrees with estimateReturn on what the pot earned", () => {
    const record = [
      snap("2025-01-01", 100_000, 2_000),
      snap("2025-07-01", 118_000, 2_500),
      snap("2026-01-01", 139_000, 2_500),
    ];
    const result = measure(record, 0, series, "NZD", undefined, NOW)!;

    expect(result.overall.annualised).toBeCloseTo(
      estimateReturn(record, 0)!.annualised,
      8,
    );
  });

  it("measures an unhedged NZD holder's return when the kiwi falls", () => {
    const flat: BenchmarkSeries = {
      dates: ["2025-01-01", "2026-01-01"],
      usd: [100, 100],
      usdToNzd: [1.5, 1.65],
    };
    const record = [snap("2025-01-01", 1_000), snap("2026-01-01", 1_000)];
    const nzd = measure(record, 0, flat, "NZD", undefined, NOW)!;
    const usd = measure(record, 0, flat, "USD", undefined, NOW)!;

    expect(nzd.overall.outcomes.sp500!.annualised).toBeCloseTo(0.1, 2);
    expect(usd.overall.outcomes.sp500!.annualised).toBeCloseTo(0, 5);
  });

  it("uses only the record the index covers", () => {
    const short = steadySeries("2025-01-01", 366, 0.1);
    const result = measure(
      [
        snap("2024-06-01", 50_000),
        snap("2025-01-02", 100_000),
        snap("2025-12-30", 110_000),
        // Weeks past the last close, so the index has no say here.
        snap("2026-02-15", 130_000),
      ],
      0,
      short,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.from.slice(0, 10)).toBe("2025-01-02");
    expect(result.overall.to.slice(0, 10)).toBe("2025-12-30");
  });

  it("keeps a recent reading just past the last close", () => {
    const short = steadySeries("2025-01-01", 366, 0.1);
    const result = measure(
      [snap("2025-01-02", 100_000), snap("2026-01-05", 110_000)],
      0,
      short,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.to.slice(0, 10)).toBe("2026-01-05");
  });

  describe("periods", () => {
    const monthly = (from: string, count: number): NetWorthSnapshot[] => {
      const start = new Date(`${from}T00:00:00Z`);

      return Array.from({ length: count }, (_, i) => {
        const d = new Date(start);

        d.setUTCMonth(d.getUTCMonth() + i);

        return snap(d.toISOString().slice(0, 10), 100_000 * Math.pow(1.01, i));
      });
    };

    const labels = (record: NetWorthSnapshot[]) =>
      measure(record, 0, series, "NZD", undefined, NOW)!.periods.map(
        (p) => p.label,
      );

    it("lists since-start, rolling windows, then calendar years", () => {
      expect(labels(monthly("2023-03-01", 40))).toEqual([
        "Since you started",
        "Last 3 months",
        "Last 12 months",
        "This year",
        "2025",
        "2024",
        "2023",
      ]);
    });

    it("dates every period by the readings it actually spans", () => {
      // Mid-month, so the year boundary is unambiguous in every timezone.
      const { periods } = measure(
        monthly("2023-03-15", 40),
        0,
        series,
        "NZD",
        undefined,
        NOW,
      )!;
      const year = periods.find((p) => p.label === "2024")!;

      expect(year.from).toBe("2023-12-15T00:00:00.000Z");
      expect(year.to).toBe("2024-12-15T00:00:00.000Z");
    });

    it("skips rolling windows the record doesn't reach back to", () => {
      expect(labels(monthly("2026-04-01", 3))).toEqual(["Since you started"]);
    });

    it("starts a first calendar year at the first reading", () => {
      const { periods } = measure(
        monthly("2024-06-15", 25),
        0,
        series,
        "NZD",
        undefined,
        NOW,
      )!;

      expect(periods.find((p) => p.label === "2024")?.from).toBe(
        "2024-06-15T00:00:00.000Z",
      );
    });

    it("states period returns without annualising them", () => {
      const { periods } = measure(
        [
          snap("2026-01-01", 100_000),
          snap("2026-03-01", 100_000),
          snap("2026-06-25", 105_000),
        ],
        0,
        series,
        "NZD",
        undefined,
        NOW,
      )!;
      const quarter = periods.find((p) => p.label === "Last 3 months")!;

      expect(quarter.periodReturn).toBeCloseTo(0.05, 3);
      expect(quarter.annualised).toBeGreaterThan(quarter.periodReturn);
    });
  });
});

describe("curveLevel", () => {
  const curve: GrowthCurve = {
    dates: ["2024-01-01", "2025-01-01", "2026-01-01"],
    level: [100, 110, 121],
  };
  const level = curveLevel(curve, 2);

  it("is null before the curve begins", () => {
    expect(level("2023-06-01T00:00:00.000Z")).toBeNull();
  });

  it("reads straight between its points", () => {
    expect(level("2025-07-02T12:00:00.000Z")).toBeCloseTo(115, 0);
  });

  it("carries on at its recent pace past the last point", () => {
    expect(level("2027-01-01T00:00:00.000Z")).toBeCloseTo(133.1, 1);
  });
});

describe("yardsticks that are not markets", () => {
  const record = [snap("2024-01-01", 100_000), snap("2026-01-01", 121_000)];

  const against = (benchmarks: Benchmark[]) =>
    measurePerformance({
      snapshots: record,
      monthlyContributions: 0,
      benchmarks,
      marketDates: series.dates,
      now: NOW,
    })!.overall.outcomes;

  it("finds a pot that earned exactly the plan's rate in line with it", () => {
    const { plan } = against([{ id: "plan", levelAt: fixedRateLevel(0.1) }]);

    expect(plan!.annualised).toBeCloseTo(0.1, 3);
    expect(plan!.gap).toBeCloseTo(0, 2);
  });

  it("drops a yardstick with no data without sinking the others", () => {
    const outcomes = against([
      { id: "plan", levelAt: fixedRateLevel(0.05) },
      { id: "inflation", levelAt: () => null },
    ]);

    expect(outcomes.plan).toBeDefined();
    expect(outcomes.inflation).toBeUndefined();
  });
});

describe("buildBenchmarks", () => {
  const flatCurve = (annual: number): GrowthCurve => ({
    dates: ["2020-01-01", "2030-01-01"],
    level: [1, Math.pow(1 + annual, 10)],
  });
  const inputs = {
    sp500: series,
    global: series,
    cpi: flatCurve(0.02),
    cash: flatCurve(0.04),
    currency: "NZD" as const,
    planReturn: 0.06,
    mortgageRate: null,
    currentMix: { shares: 100 },
    snapshots: [],
  };
  const growth = (
    benchmarks: Benchmark[],
    id: Benchmark["id"],
    from = "2024-01-01T00:00:00.000Z",
    to = "2025-01-01T00:00:00.000Z",
  ) => {
    const { levelAt } = benchmarks.find((b) => b.id === id)!;

    return levelAt(to)! / levelAt(from)! - 1;
  };

  it("leaves out a mortgage you don't have and a mix with no history", () => {
    const ids = buildBenchmarks({ ...inputs, tax: null }).map((b) => b.id);

    expect(ids).toEqual(["plan", "inflation", "global", "sp500", "cash"]);
  });

  it("charges shares Fair Dividend Rate when measuring after tax", () => {
    const before = buildBenchmarks({ ...inputs, tax: null });
    const after = buildBenchmarks({
      ...inputs,
      tax: { pir: 0.28, marginal: 0.33 },
    });

    expect(growth(before, "global")).toBeCloseTo(0.1, 2);
    expect(growth(after, "global")).toBeCloseTo(0.1 - 0.0154, 2);
  });

  it("taxes interest in full and leaves the plan and prices alone", () => {
    const before = buildBenchmarks({ ...inputs, tax: null });
    const after = buildBenchmarks({
      ...inputs,
      tax: { pir: 0.28, marginal: 0.33 },
    });

    expect(growth(after, "cash")).toBeCloseTo(0.04 * 0.67, 3);
    expect(growth(after, "plan")).toBeCloseTo(growth(before, "plan"), 8);
    expect(growth(after, "inflation")).toBeCloseTo(
      growth(before, "inflation"),
      8,
    );
  });
});

describe("mixLevel", () => {
  const from = "2024-01-01T00:00:00.000Z";
  const to = "2025-01-01T00:00:00.000Z";
  const legs = {
    shares: fixedRateLevel(0.1),
    cash: fixedRateLevel(0),
  };
  const growth = (level: ReturnType<typeof mixLevel>) =>
    level!(to)! / level!(from)! - 1;

  it("weights the legs by what is held", () => {
    const held = mixLevel(
      [{ date: from, mix: { shares: 50, savings: 50 } }],
      { shares: 1 },
      legs,
      null,
    );

    expect(growth(held)).toBeCloseTo(0.05, 3);
  });

  it("reads KiwiSaver as a growth fund", () => {
    const level = mixLevel([{ date: from }], { kiwisaver: 1 }, legs, null);

    expect(growth(level)).toBeCloseTo(0.08, 3);
  });

  it("uses today's mix for snapshots that didn't record one", () => {
    const level = mixLevel([{ date: from }], { savings: 1 }, legs, null);

    expect(growth(level)).toBeCloseTo(0, 5);
  });

  it("scales up around holdings with no fair index", () => {
    const level = mixLevel(
      [{ date: from, mix: { shares: 50, property: 500 } }],
      { shares: 1 },
      legs,
      null,
    );

    expect(growth(level)).toBeCloseTo(0.1, 3);
  });

  it("is null when nothing held has an index", () => {
    expect(
      mixLevel([{ date: from }], { property: 100 }, legs, null),
    ).toBeNull();
  });

  it("rebalances to each snapshot's mix", () => {
    const middle = "2024-07-02T00:00:00.000Z";
    const level = mixLevel(
      [
        { date: from, mix: { shares: 1 } },
        { date: middle, mix: { savings: 1 } },
      ],
      { shares: 1 },
      legs,
      null,
    );

    // Shares for the first half, cash for the second.
    expect(growth(level)).toBeCloseTo(Math.sqrt(1.1) - 1, 2);
  });
});

describe("mortgageRateOf", () => {
  const debt = (
    type: Liability["type"],
    balance: number,
    interestRate: number,
  ): Liability => ({
    id: `${type}${balance}`,
    name: type,
    type,
    balance,
    currency: "NZD",
    interestRate,
    payment: 0,
    frequency: "monthly",
    createdAt: "",
    updatedAt: "",
  });

  it("is null without a mortgage", () => {
    expect(mortgageRateOf([debt("car-loan", 1_000, 0.1)], 1.6)).toBeNull();
    expect(mortgageRateOf([debt("mortgage", 0, 0.06)], 1.6)).toBeNull();
  });

  it("weights several mortgages by what is owed", () => {
    expect(
      mortgageRateOf(
        [
          debt("mortgage", 300_000, 0.06),
          debt("mortgage", 100_000, 0.08),
          debt("car-loan", 900_000, 0.2),
        ],
        1.6,
      ),
    ).toBeCloseTo(0.065, 6);
  });
});

describe("inCurrency", () => {
  const record: NetWorthSnapshot[] = [
    snap("2025-01-01", 160_000, 1_600),
    {
      ...snap("2026-01-01", 110_000, 1_000),
      currency: "USD",
    },
  ];

  it("converts only the snapshots in another currency", () => {
    const [a, b] = inCurrency(record, "NZD", 1.6);

    expect(a).toBe(record[0]);
    expect(b.currency).toBe("NZD");
    expect(b.assetsTotal).toBeCloseTo(176_000);
    expect(b.monthlyContributions).toBeCloseTo(1_600);
  });

  it("converts the recorded mix with everything else", () => {
    const [converted] = inCurrency(
      [
        {
          ...snap("2026-01-01", 100, 0),
          currency: "USD",
          fireAssetsByType: { shares: 100 },
        },
      ],
      "NZD",
      1.6,
    );

    expect(converted.fireAssetsByType?.shares).toBeCloseTo(160);
  });

  it("leaves unrecorded fields unrecorded", () => {
    const [, b] = inCurrency(record, "NZD", 1.6);

    expect(b.fireAssetsTotal).toBeUndefined();
  });

  it("stops a currency switch reading as a return", () => {
    const noContributions: NetWorthSnapshot[] = [
      snap("2025-01-01", 160_000),
      { ...snap("2026-01-01", 110_000), currency: "USD" },
    ];
    const converted = inCurrency(noContributions, "NZD", 1.6);

    expect(estimateReturn(converted, 0)!.annualised).toBeCloseTo(0.1, 2);
    expect(estimateReturn(noContributions, 0)!.annualised).toBeLessThan(-0.2);
  });
});
