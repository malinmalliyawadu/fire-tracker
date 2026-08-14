import type { Kid } from "@/types";

import { describe, expect, it } from "vitest";

import {
  hypotheticalKidsCostByYear,
  KID_COST_BANDS,
  KID_INDEPENDENT_AGE,
  kidCostAtAge,
  kidsCostByYear,
} from "../kids";

const kid = (name: string, birthYear: number): Kid => ({
  id: name,
  name,
  birthYear,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("kidCostAtAge", () => {
  it("costs nothing before birth", () => {
    expect(kidCostAtAge(-1)).toBe(0);
    expect(kidCostAtAge(-10)).toBe(0);
  });

  it("costs nothing once independent", () => {
    expect(kidCostAtAge(KID_INDEPENDENT_AGE)).toBe(0);
    expect(kidCostAtAge(KID_INDEPENDENT_AGE + 5)).toBe(0);
  });

  it("is highest in the childcare years", () => {
    const childcare = kidCostAtAge(2);

    expect(childcare).toBe(KID_COST_BANDS[0].annualNzd);
    expect(childcare).toBeGreaterThan(kidCostAtAge(8));
  });

  it("dips through primary school then climbs again", () => {
    expect(kidCostAtAge(8)).toBeLessThan(kidCostAtAge(2));
    expect(kidCostAtAge(15)).toBeGreaterThan(kidCostAtAge(8));
    expect(kidCostAtAge(19)).toBeGreaterThan(kidCostAtAge(15));
  });

  it("switches band exactly at the boundary", () => {
    for (const band of KID_COST_BANDS) {
      expect(kidCostAtAge(band.untilAge - 1)).toBe(band.annualNzd);
      expect(kidCostAtAge(band.untilAge)).not.toBe(band.annualNzd);
    }
  });
});

describe("kidsCostByYear", () => {
  const startYear = 2026;

  it("returns one entry per year, inclusive", () => {
    const costs = kidsCostByYear({ kids: [], startYear, years: 10 });

    expect(costs).toHaveLength(11);
    expect(costs.every((c) => c === 0)).toBe(true);
  });

  it("costs nothing until a future kid arrives", () => {
    const costs = kidsCostByYear({
      kids: [kid("Future", startYear + 3)],
      startYear,
      years: 10,
    });

    expect(costs[0]).toBe(0);
    expect(costs[2]).toBe(0);
    expect(costs[3]).toBeGreaterThan(0);
  });

  it("drops to zero once a kid is independent", () => {
    const costs = kidsCostByYear({
      kids: [kid("Teen", startYear - 20)],
      startYear,
      years: 10,
    });

    // Age 20 now, independent at 22 — so year 2 onward is free.
    expect(costs[0]).toBeGreaterThan(0);
    expect(costs[2]).toBe(0);
  });

  it("adds up across several kids", () => {
    const one = kidsCostByYear({
      kids: [kid("A", startYear)],
      startYear,
      years: 5,
    });
    const two = kidsCostByYear({
      kids: [kid("A", startYear), kid("B", startYear)],
      startYear,
      years: 5,
    });

    expect(two[0]).toBe(one[0] * 2);
  });

  it("staggered births produce a staggered cost curve", () => {
    const costs = kidsCostByYear({
      kids: [kid("A", startYear), kid("B", startYear + 4)],
      startYear,
      years: 6,
    });

    // Only the first kid at year 0, both by year 4.
    expect(costs[0]).toBe(kidCostAtAge(0));
    expect(costs[4]).toBe(kidCostAtAge(4) + kidCostAtAge(0));
  });
});

describe("hypotheticalKidsCostByYear", () => {
  it("treats kids as born today", () => {
    const costs = hypotheticalKidsCostByYear(1, 25);

    expect(costs[0]).toBe(kidCostAtAge(0));
    expect(costs[10]).toBe(kidCostAtAge(10));
  });

  it("scales with the count", () => {
    expect(hypotheticalKidsCostByYear(3, 5)[0]).toBe(kidCostAtAge(0) * 3);
  });

  it("is all zeros for a count of zero or less", () => {
    expect(hypotheticalKidsCostByYear(0, 5).every((c) => c === 0)).toBe(true);
    expect(hypotheticalKidsCostByYear(-2, 5).every((c) => c === 0)).toBe(true);
  });

  it("stops costing once past independence", () => {
    const costs = hypotheticalKidsCostByYear(1, 30);

    expect(costs[KID_INDEPENDENT_AGE]).toBe(0);
  });
});
