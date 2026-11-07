import type { NetWorthSnapshot } from "@/store/history";

import { describe, expect, it } from "vitest";

import { generateProjection } from "../projection";
import {
  attributeGrowth,
  comparePlan,
  estimateReturn,
  projectedAt,
  readPot,
  yearsBetween,
} from "../tracking";

const snap = (date: string, netWorth: number): NetWorthSnapshot => ({
  id: date,
  date,
  netWorth,
  assetsTotal: netWorth,
  liabilitiesTotal: 0,
  currency: "NZD",
});

const projection = generateProjection({
  currentNetWorth: 100_000,
  monthlySavings: 1_000,
  expectedReturn: 0.07,
  inflationRate: 0.025,
  currentAge: 40,
  retirementAge: 65,
  annualExpenses: 40_000,
  years: 20,
});

describe("yearsBetween", () => {
  it("measures a year", () => {
    expect(
      yearsBetween("2026-01-01T00:00:00Z", "2027-01-01T00:00:00Z"),
    ).toBeCloseTo(1, 2);
  });

  it("is negative going backwards", () => {
    expect(
      yearsBetween("2027-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    ).toBeLessThan(0);
  });
});

describe("projectedAt", () => {
  it("returns null for an empty projection", () => {
    expect(projectedAt([], 5)).toBeNull();
  });

  it("returns the start value at or before year zero", () => {
    expect(projectedAt(projection, 0)).toBe(projection[0].netWorth);
    expect(projectedAt(projection, -3)).toBe(projection[0].netWorth);
  });

  it("clamps past the end of the horizon", () => {
    const last = projection[projection.length - 1];

    expect(projectedAt(projection, 999)).toBe(last.netWorth);
  });

  it("interpolates between whole years", () => {
    const half = projectedAt(projection, 3.5)!;

    expect(half).toBeGreaterThan(projection[3].netWorth);
    expect(half).toBeLessThan(projection[4].netWorth);
  });

  it("lands exactly on whole years", () => {
    expect(projectedAt(projection, 4)).toBeCloseTo(projection[4].netWorth, 6);
  });
});

describe("comparePlan", () => {
  it("needs at least two snapshots", () => {
    expect(comparePlan([], projection)).toBeNull();
    expect(
      comparePlan([snap("2026-01-01T00:00:00Z", 100_000)], projection),
    ).toBeNull();
  });

  it("needs the snapshots to be far enough apart", () => {
    const tooClose = [
      snap("2026-01-01T00:00:00Z", 100_000),
      snap("2026-01-05T00:00:00Z", 101_000),
    ];

    expect(comparePlan(tooClose, projection)).toBeNull();
  });

  it("reports being ahead when reality beat the projection", () => {
    const snapshots = [
      snap("2026-01-01T00:00:00Z", 100_000),
      snap("2027-01-01T00:00:00Z", 500_000),
    ];
    const result = comparePlan(snapshots, projection)!;

    expect(result.delta).toBeGreaterThan(0);
    expect(result.actual).toBe(500_000);
    expect(result.yearsTracked).toBeCloseTo(1, 1);
  });

  it("reports being behind when reality fell short", () => {
    const snapshots = [
      snap("2026-01-01T00:00:00Z", 100_000),
      snap("2027-01-01T00:00:00Z", 90_000),
    ];
    const result = comparePlan(snapshots, projection)!;

    expect(result.delta).toBeLessThan(0);
    expect(result.deltaPercent).toBeLessThan(0);
  });

  it("sorts snapshots, so order in the array doesn't matter", () => {
    const forwards = [
      snap("2026-01-01T00:00:00Z", 100_000),
      snap("2027-01-01T00:00:00Z", 130_000),
    ];
    const backwards = [...forwards].reverse();

    expect(comparePlan(backwards, projection)).toEqual(
      comparePlan(forwards, projection),
    );
  });
});

describe("attributeGrowth", () => {
  const snapshots = [
    snap("2026-01-01T00:00:00Z", 100_000),
    snap("2027-01-01T00:00:00Z", 160_000),
  ];

  it("needs at least two snapshots", () => {
    expect(attributeGrowth([snapshots[0]], 1_000)).toBeNull();
  });

  it("splits growth into contributions and the residual", () => {
    const result = attributeGrowth(snapshots, 2_000)!;

    expect(result.total).toBe(60_000);
    // 2,000/mo for a year is roughly 24,000 in.
    expect(result.contributions).toBeCloseTo(24_000, -2);
    expect(result.market).toBeCloseTo(36_000, -2);
  });

  it("attributes everything to the market when nothing was contributed", () => {
    const result = attributeGrowth(snapshots, 0)!;

    expect(result.contributions).toBe(0);
    expect(result.market).toBe(60_000);
    expect(result.marketShare).toBeCloseTo(1, 6);
  });

  it("can show a negative market contribution", () => {
    const falling = [
      snap("2026-01-01T00:00:00Z", 100_000),
      snap("2027-01-01T00:00:00Z", 105_000),
    ];
    const result = attributeGrowth(falling, 2_000)!;

    // Put in ~24k but only gained 5k, so the market lost money.
    expect(result.market).toBeLessThan(0);
  });

  it("returns null when both snapshots share a timestamp", () => {
    const sameInstant = [
      snap("2026-01-01T00:00:00Z", 100_000),
      { ...snap("2026-01-01T00:00:00Z", 120_000), id: "second" },
    ];

    expect(attributeGrowth(sameInstant, 1_000)).toBeNull();
  });
});

describe("readPot", () => {
  it("takes the recorded pot when a snapshot carries one", () => {
    const reading = readPot(
      {
        ...snap("2026-01-01T00:00:00Z", 900_000),
        assetsTotal: 1_200_000,
        liabilitiesTotal: 300_000,
        fireNetWorth: 500_000,
        fireAssetsTotal: 520_000,
        monthlyContributions: 2_500,
      },
      { assets: 999, liabilities: 999 },
    );

    expect(reading.netWorth).toBe(500_000);
    expect(reading.assets).toBe(520_000);
    expect(reading.debt).toBe(20_000);
    expect(reading.monthlyContributions).toBe(2_500);
  });

  it("estimates an older snapshot from today's exclusions", () => {
    const reading = readPot(
      {
        ...snap("2026-01-01T00:00:00Z", 900_000),
        assetsTotal: 1_200_000,
        liabilitiesTotal: 300_000,
      },
      { assets: 650_000, liabilities: 380_000 },
    );

    expect(reading.assets).toBe(550_000);
    expect(reading.netWorth).toBe(630_000);
    expect(reading.debt).toBe(0);
    expect(reading.monthlyContributions).toBeUndefined();
  });

  it("is the plain snapshot when nothing is excluded", () => {
    const reading = readPot(snap("2026-01-01T00:00:00Z", 100_000));

    expect(reading.netWorth).toBe(100_000);
    expect(reading.assets).toBe(100_000);
  });
});

describe("estimateReturn", () => {
  const invested = (
    date: string,
    assets: number,
    monthlyContributions?: number,
  ): NetWorthSnapshot => ({
    ...snap(date, assets),
    monthlyContributions,
  });

  it("needs two snapshots far enough apart", () => {
    expect(estimateReturn([], 0)).toBeNull();
    expect(
      estimateReturn([invested("2026-01-01T00:00:00Z", 100_000)], 0),
    ).toBeNull();
    expect(
      estimateReturn(
        [
          invested("2026-01-01T00:00:00Z", 100_000),
          invested("2026-01-10T00:00:00Z", 101_000),
        ],
        0,
      ),
    ).toBeNull();
  });

  it("recovers a plain compound rate with no contributions", () => {
    const result = estimateReturn(
      [
        invested("2024-01-01T00:00:00Z", 100_000),
        invested("2026-01-01T00:00:00Z", 100_000 * 1.07 * 1.07),
      ],
      0,
    )!;

    expect(result.annualised).toBeCloseTo(0.07, 3);
    expect(result.contributions).toBe(0);
    expect(result.gain).toBeCloseTo(14_490, 0);
    expect(result.yearsTracked).toBeCloseTo(2, 2);
  });

  it("does not count contributions as return", () => {
    // 12 months of $1,000 into a pot that earned nothing.
    const result = estimateReturn(
      [
        invested("2025-01-01T00:00:00Z", 100_000),
        invested("2026-01-01T00:00:00Z", 112_000),
      ],
      1_000,
    )!;

    // A calendar year is 365 days, a hair under twelve 365.25-day months.
    expect(result.contributions).toBeCloseTo(12_000, -2);
    expect(result.gain).toBeCloseTo(0, -2);
    expect(Math.abs(result.annualised)).toBeLessThan(0.002);
  });

  it("recovers the rate when contributions compound monthly", () => {
    // Build the closing value from a known 6% a year, paid monthly.
    const monthly = 1_000;
    const rate = Math.pow(1.06, 1 / 12) - 1;
    let value = 200_000;

    for (let m = 0; m < 12; m++) value = (value + monthly) * (1 + rate);

    const result = estimateReturn(
      [
        invested("2025-01-01T00:00:00Z", 200_000),
        invested("2026-01-01T00:00:00Z", value),
      ],
      monthly,
    )!;

    expect(result.annualised).toBeCloseTo(0.06, 2);
  });

  it("uses the rate recorded on each snapshot rather than today's", () => {
    // Half a year at $0 a month, then half a year at $2,000, with no growth.
    const result = estimateReturn(
      [
        invested("2025-01-01T00:00:00Z", 100_000, 0),
        invested("2025-07-02T12:00:00Z", 100_000, 2_000),
        invested("2026-01-01T00:00:00Z", 112_000),
      ],
      // Today's rate would wrongly imply $60k went in.
      5_000,
    )!;

    expect(result.contributions).toBeCloseTo(12_000, -2);
    expect(Math.abs(result.annualised)).toBeLessThan(0.005);
  });

  it("falls back to today's rate where none was recorded", () => {
    const result = estimateReturn(
      [
        invested("2025-01-01T00:00:00Z", 100_000),
        invested("2025-07-02T12:00:00Z", 106_000, 1_000),
        invested("2026-01-01T00:00:00Z", 112_000),
      ],
      1_000,
    )!;

    expect(result.contributions).toBeCloseTo(12_000, -2);
  });

  it("reads assets on the pot basis", () => {
    const result = estimateReturn(
      [
        { ...invested("2025-01-01T00:00:00Z", 0), assetsTotal: 750_000 },
        { ...invested("2026-01-01T00:00:00Z", 0), assetsTotal: 757_000 },
      ],
      0,
      undefined,
      { assets: 650_000, liabilities: 0 },
    )!;

    // 100k to 107k once the home is taken out, not 750k to 757k.
    expect(result.startValue).toBe(100_000);
    expect(result.annualised).toBeCloseTo(0.07, 3);
  });

  it("reports a loss as a negative rate", () => {
    const result = estimateReturn(
      [
        invested("2025-01-01T00:00:00Z", 100_000),
        invested("2026-01-01T00:00:00Z", 90_000),
      ],
      0,
    )!;

    expect(result.annualised).toBeCloseTo(-0.1, 3);
    expect(result.gain).toBe(-10_000);
  });

  it("gives up on a window no return could explain", () => {
    expect(
      estimateReturn(
        [
          invested("2025-12-01T00:00:00Z", 1_000),
          invested("2026-01-05T00:00:00Z", 900_000),
        ],
        0,
      ),
    ).toBeNull();
  });

  it("needs something invested to start from", () => {
    expect(
      estimateReturn(
        [
          invested("2025-01-01T00:00:00Z", 0),
          invested("2026-01-01T00:00:00Z", 12_000),
        ],
        1_000,
      ),
    ).toBeNull();
  });
});

describe("attributeGrowth with recorded rates", () => {
  it("honours the rate recorded on each snapshot", () => {
    const result = attributeGrowth(
      [
        { ...snap("2025-01-01T00:00:00Z", 100_000), monthlyContributions: 0 },
        {
          ...snap("2025-07-02T12:00:00Z", 100_000),
          monthlyContributions: 2_000,
        },
        snap("2026-01-01T00:00:00Z", 115_000),
      ],
      5_000,
    )!;

    expect(result.contributions).toBeCloseTo(12_000, -2);
    expect(result.market).toBeCloseTo(3_000, -2);
  });
});
