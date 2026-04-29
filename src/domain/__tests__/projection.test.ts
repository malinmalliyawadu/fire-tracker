import { describe, expect, it } from "vitest";

import { generateProjection } from "../projection";

describe("generateProjection", () => {
  const base = {
    currentNetWorth: 100_000,
    monthlySavings: 1_000,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 30,
    retirementAge: 65,
    annualExpenses: 40_000,
    years: 40,
  };

  it("first point matches starting net worth", () => {
    const points = generateProjection(base);

    expect(points[0].netWorth).toBe(100_000);
    expect(points[0].age).toBe(30);
    expect(points[0].year).toBe(0);
  });

  it("returns years + 1 points", () => {
    const points = generateProjection(base);

    expect(points).toHaveLength(41);
  });

  it("net worth grows during accumulation phase", () => {
    const points = generateProjection(base);
    const accumulation = points.slice(0, 35);

    for (let i = 1; i < accumulation.length; i++) {
      expect(accumulation[i].netWorth).toBeGreaterThan(
        accumulation[i - 1].netWorth,
      );
    }
  });

  it("contributions stop after retirement age", () => {
    const points = generateProjection(base);
    const atRetirement = points.find((p) => p.age === 65)!;
    const fiveYearsLater = points.find((p) => p.age === 70)!;

    expect(fiveYearsLater.contributed).toBe(atRetirement.contributed);
  });

  it("withdrawals accumulate after retirement age", () => {
    const points = generateProjection(base);
    const atRetirement = points.find((p) => p.age === 65)!;
    const fiveYearsLater = points.find((p) => p.age === 70)!;

    expect(fiveYearsLater.withdrawn).toBeGreaterThan(atRetirement.withdrawn);
  });

  it("uses real return (return minus inflation)", () => {
    const noInflation = generateProjection({ ...base, inflationRate: 0 });
    const withInflation = generateProjection({ ...base, inflationRate: 0.025 });

    expect(noInflation[10].netWorth).toBeGreaterThan(
      withInflation[10].netWorth,
    );
  });

  it("NZ Super extends portfolio life from start age onward", () => {
    const long = { ...base, retirementAge: 50, years: 60 };
    const without = generateProjection(long);
    const withSuper = generateProjection({
      ...long,
      nzSuperAnnualInDisplay: 28_000,
      nzSuperStartAge: 65,
    });

    // Same shape pre-65
    const at60Without = without.find((p) => p.age === 60)!;
    const at60With = withSuper.find((p) => p.age === 60)!;

    expect(at60With.netWorth).toBe(at60Without.netWorth);

    // After 65, NZ Super means less is withdrawn, so portfolio is healthier
    const at80Without = without.find((p) => p.age === 80)!;
    const at80With = withSuper.find((p) => p.age === 80)!;

    expect(at80With.netWorth).toBeGreaterThan(at80Without.netWorth);
  });

  it("NZ Super does not apply before its start age", () => {
    const points = generateProjection({
      ...base,
      retirementAge: 50,
      years: 60,
      nzSuperAnnualInDisplay: 28_000,
      nzSuperStartAge: 65,
    });
    const at60 = points.find((p) => p.age === 60)!;
    const at61 = points.find((p) => p.age === 61)!;

    // pre-65 withdrawals == full annualExpenses
    expect(at61.withdrawn - at60.withdrawn).toBeCloseTo(40_000);
  });

  describe("KiwiSaver locked pot", () => {
    const lockedBase = {
      currentNetWorth: 200_000,
      monthlySavings: 1_500,
      expectedReturn: 0.07,
      inflationRate: 0.025,
      currentAge: 30,
      retirementAge: 50,
      annualExpenses: 40_000,
      years: 60,
      currentLockedNetWorth: 80_000,
      monthlyLockedSavings: 500,
      unlockAge: 65,
    };

    it("locked + accessible always sums to netWorth", () => {
      const points = generateProjection(lockedBase);

      for (const p of points) {
        expect(p.accessible + p.locked).toBe(p.netWorth);
      }
    });

    it("locked stays untouched between retirement and unlock age", () => {
      const points = generateProjection(lockedBase);
      const atRetire = points.find((p) => p.age === 50)!;
      const at60 = points.find((p) => p.age === 60)!;

      // accessible draws down (or could be negative if depleted)
      expect(at60.accessible).toBeLessThan(atRetire.accessible);
      // locked keeps compounding — strictly higher
      expect(at60.locked).toBeGreaterThan(atRetire.locked);
    });

    it("after unlock age locked merges into accessible and locked is 0", () => {
      const points = generateProjection(lockedBase);
      const at65 = points.find((p) => p.age === 65)!;

      expect(at65.locked).toBe(0);
      expect(at65.accessible).toBe(at65.netWorth);
    });

    it("setting locked = 0 behaves like the no-lock projection", () => {
      const withLocked0 = generateProjection({
        ...lockedBase,
        currentLockedNetWorth: 0,
        monthlyLockedSavings: 0,
      });
      const withoutLockField = generateProjection({
        currentNetWorth: lockedBase.currentNetWorth,
        monthlySavings: lockedBase.monthlySavings,
        expectedReturn: lockedBase.expectedReturn,
        inflationRate: lockedBase.inflationRate,
        currentAge: lockedBase.currentAge,
        retirementAge: lockedBase.retirementAge,
        annualExpenses: lockedBase.annualExpenses,
        years: lockedBase.years,
      });

      for (let i = 0; i < withLocked0.length; i++) {
        expect(withLocked0[i].netWorth).toBe(withoutLockField[i].netWorth);
      }
    });
  });
});
