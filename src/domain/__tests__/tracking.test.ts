import type { NetWorthSnapshot } from "@/store/history";

import { describe, expect, it } from "vitest";

import { generateProjection } from "../projection";
import {
  attributeGrowth,
  comparePlan,
  projectedAt,
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
