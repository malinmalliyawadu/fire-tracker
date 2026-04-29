import { describe, expect, it } from "vitest";

import { computeFireTargets, progressPercent, yearsToFire } from "../fire";

describe("computeFireTargets", () => {
  const base = {
    annualExpenses: 50_000,
    withdrawalRate: 0.04,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 30,
    retirementAge: 65,
  };

  it("traditional FIRE = expenses / withdrawal rate", () => {
    const t = computeFireTargets(base);

    expect(t.traditional).toBe(1_250_000);
  });

  it("lean = 60% of traditional, fat = 150%", () => {
    const t = computeFireTargets(base);

    expect(t.lean).toBeCloseTo(750_000);
    expect(t.fat).toBeCloseTo(1_875_000);
  });

  it("coast discounts traditional by real return over years to retirement", () => {
    const t = computeFireTargets(base);
    const realReturn = 0.07 - 0.025;
    const expected = 1_250_000 / Math.pow(1 + realReturn, 35);

    expect(t.coast).toBeCloseTo(expected, 2);
  });

  it("coast equals traditional when already at retirement age", () => {
    const t = computeFireTargets({ ...base, currentAge: 65 });

    expect(t.coast).toBeCloseTo(t.traditional);
  });
});

describe("yearsToFire", () => {
  it("returns 0 if already at target", () => {
    expect(
      yearsToFire({
        netWorth: 1_000_000,
        monthlyContribution: 0,
        target: 1_000_000,
        expectedReturn: 0.07,
      }),
    ).toBe(0);
  });

  it("returns Infinity with no contribution and no return", () => {
    expect(
      yearsToFire({
        netWorth: 100_000,
        monthlyContribution: 0,
        target: 1_000_000,
        expectedReturn: 0,
      }),
    ).toBe(Infinity);
  });

  it("solves linearly when expectedReturn is 0", () => {
    const years = yearsToFire({
      netWorth: 100_000,
      monthlyContribution: 1_000,
      target: 220_000,
      expectedReturn: 0,
    });

    expect(years).toBeCloseTo(10, 4);
  });

  it("more contribution → fewer years", () => {
    const a = yearsToFire({
      netWorth: 100_000,
      monthlyContribution: 1_000,
      target: 1_000_000,
      expectedReturn: 0.07,
    });
    const b = yearsToFire({
      netWorth: 100_000,
      monthlyContribution: 3_000,
      target: 1_000_000,
      expectedReturn: 0.07,
    });

    expect(b).toBeLessThan(a);
  });
});

describe("progressPercent", () => {
  it("returns 0 for negative net worth", () => {
    expect(progressPercent(-10, 1000)).toBe(0);
  });

  it("clamps at 100", () => {
    expect(progressPercent(2000, 1000)).toBe(100);
  });

  it("scales linearly", () => {
    expect(progressPercent(250, 1000)).toBe(25);
  });

  it("returns 100 when target is zero and net worth non-negative", () => {
    expect(progressPercent(0, 0)).toBe(100);
  });
});
