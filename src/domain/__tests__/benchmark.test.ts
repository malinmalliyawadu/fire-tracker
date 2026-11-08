import type { NetWorthSnapshot } from "@/store/history";
import type { BenchmarkSeries } from "../benchmark";

import { describe, expect, it } from "vitest";

import { levelOn, measurePerformance } from "../benchmark";
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
    expect(
      measurePerformance([snap("2026-06-20", 100)], 0, series, "NZD"),
    ).toBeNull();
    expect(
      measurePerformance(
        [snap("2026-06-20", 100), snap("2026-06-25", 101)],
        0,
        series,
        "NZD",
      ),
    ).toBeNull();
  });

  it("recovers the index's own rate for a pot that matched it", () => {
    const result = measurePerformance(
      [snap("2024-01-01", 100_000), snap("2026-01-01", 121_000)],
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.benchmarkAnnualised).toBeCloseTo(0.1, 2);
    expect(result.overall.annualised).toBeCloseTo(0.1, 2);
    expect(result.overall.gap).toBeCloseTo(0, 2);
    expect(result.overall.benchmark).toBeCloseTo(121_000, -3);
  });

  it("reports a positive gap when the pot beats the index", () => {
    const result = measurePerformance(
      [snap("2024-01-01", 100_000), snap("2026-01-01", 144_000)],
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;

    expect(result.overall.annualised).toBeCloseTo(0.2, 2);
    expect(result.overall.gap).toBeCloseTo(0.1, 2);
    expect(result.overall.difference).toBeGreaterThan(20_000);
  });

  it("gives the index the same contributions on the same dates", () => {
    const result = measurePerformance(
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
    expect(last.benchmark).toBeCloseTo(110_000 + 12_000 * 1.0488, -2);
    expect(result.overall.benchmarkAnnualised).toBeCloseTo(0.1, 2);
  });

  it("agrees with estimateReturn on what the pot earned", () => {
    const record = [
      snap("2025-01-01", 100_000, 2_000),
      snap("2025-07-01", 118_000, 2_500),
      snap("2026-01-01", 139_000, 2_500),
    ];
    const result = measurePerformance(
      record,
      0,
      series,
      "NZD",
      undefined,
      NOW,
    )!;

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
    const nzd = measurePerformance(record, 0, flat, "NZD", undefined, NOW)!;
    const usd = measurePerformance(record, 0, flat, "USD", undefined, NOW)!;

    expect(nzd.overall.benchmarkAnnualised).toBeCloseTo(0.1, 2);
    expect(usd.overall.benchmarkAnnualised).toBeCloseTo(0, 5);
  });

  it("uses only the record the index covers", () => {
    const short = steadySeries("2025-01-01", 366, 0.1);
    const result = measurePerformance(
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
    const result = measurePerformance(
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
      measurePerformance(record, 0, series, "NZD", undefined, NOW)!.periods.map(
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
      const { periods } = measurePerformance(
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
      const { periods } = measurePerformance(
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
      const { periods } = measurePerformance(
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
