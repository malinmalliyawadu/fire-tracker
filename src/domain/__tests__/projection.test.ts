import { describe, expect, it } from "vitest";

import { generateProjection, yearsToTarget } from "../projection";

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

    it("locked pot ignores debt when summing to netWorth", () => {
      const points = generateProjection({
        ...lockedBase,
        liabilities: [
          { balance: 300_000, interestRate: 0.06, annualPayment: 30_000 },
        ],
      });

      for (const p of points) {
        expect(p.accessible + p.locked - p.debt).toBe(p.netWorth);
      }
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

  describe("liabilities", () => {
    const mortgage = {
      balance: 400_000,
      interestRate: 0.06,
      annualPayment: 36_000,
    };
    const withDebt = { ...base, liabilities: [mortgage] };

    it("starting net worth is unchanged — debt is already netted off", () => {
      const points = generateProjection(withDebt);

      expect(points[0].netWorth).toBe(base.currentNetWorth);
      expect(points[0].debt).toBe(mortgage.balance);
    });

    it("no liabilities means no debt at any point", () => {
      const points = generateProjection(base);

      expect(points.every((p) => p.debt === 0)).toBe(true);
    });

    it("balance falls every year until it clears", () => {
      const points = generateProjection(withDebt);

      for (let i = 1; i < points.length; i++) {
        expect(points[i].debt).toBeLessThan(points[i - 1].debt);
        if (points[i].debt === 0) break;
      }

      expect(points.at(-1)!.debt).toBe(0);
    });

    it("a payment below the interest charge lets the balance grow", () => {
      const points = generateProjection({
        ...base,
        liabilities: [
          { balance: 100_000, interestRate: 0.1, annualPayment: 1_000 },
        ],
      });

      // Nominal balance grows; real terms still outpace 2.5% inflation.
      expect(points[10].debt).toBeGreaterThan(points[0].debt);
    });

    it("freed-up repayments are redirected into savings after payoff", () => {
      const withRepayments = generateProjection(withDebt);
      const noRedirect = generateProjection({
        ...base,
        // Same debt, but a payment so small it never clears within the horizon.
        liabilities: [
          { balance: 400_000, interestRate: 0.06, annualPayment: 24_001 },
        ],
      });
      const payoff = withRepayments.find((p) => p.debt === 0)!;
      const later = withRepayments.find((p) => p.age === payoff.age + 10)!;
      const laterNoRedirect = noRedirect.find(
        (p) => p.age === payoff.age + 10,
      )!;

      expect(later.accessible).toBeGreaterThan(laterNoRedirect.accessible);
      expect(later.contributed).toBeGreaterThan(laterNoRedirect.contributed);
    });

    it("debt service is funded from the portfolio once retired", () => {
      const retireEarly = {
        ...base,
        retirementAge: 40,
        years: 30,
      };
      const without = generateProjection(retireEarly);
      const withMortgage = generateProjection({
        ...retireEarly,
        liabilities: [mortgage],
      });
      const at45 = withMortgage.find((p) => p.age === 45)!;
      const at45Without = without.find((p) => p.age === 45)!;

      // Retirement withdrawals now cover expenses *and* the mortgage.
      expect(at45.withdrawn).toBeGreaterThan(at45Without.withdrawn);
    });

    it("more debt against the same assets means lower net worth", () => {
      // Both start with $500k gross assets; only the debt differs.
      const light = generateProjection({
        ...base,
        currentNetWorth: 100_000,
        liabilities: [
          { balance: 400_000, interestRate: 0.06, annualPayment: 36_000 },
        ],
      });
      const heavy = generateProjection({
        ...base,
        currentNetWorth: -100_000,
        liabilities: [
          { balance: 600_000, interestRate: 0.06, annualPayment: 36_000 },
        ],
      });

      for (let i = 0; i < light.length; i++) {
        expect(heavy[i].netWorth).toBeLessThan(light[i].netWorth);
      }
    });
  });
});

describe("yearsToTarget", () => {
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

  it("returns 0 when already at or past the target", () => {
    const points = generateProjection(base);

    expect(yearsToTarget(points, 100_000)).toBe(0);
    expect(yearsToTarget(points, 50_000)).toBe(0);
  });

  it("returns 0 for a non-positive target", () => {
    expect(yearsToTarget(generateProjection(base), 0)).toBe(0);
  });

  it("returns Infinity when the target is never reached", () => {
    expect(yearsToTarget(generateProjection(base), 500_000_000)).toBe(Infinity);
  });

  it("interpolates between the bracketing years", () => {
    const points = generateProjection(base);
    const target = (points[10].netWorth + points[11].netWorth) / 2;
    const years = yearsToTarget(points, target);

    expect(years).toBeGreaterThan(10);
    expect(years).toBeLessThan(11);
    expect(years).toBeCloseTo(10.5, 1);
  });

  it("lands on the year the projection first crosses the target", () => {
    const points = generateProjection(base);
    const years = yearsToTarget(points, points[20].netWorth);

    expect(years).toBeCloseTo(20, 6);
  });

  it("a bigger target takes longer", () => {
    const points = generateProjection(base);

    expect(yearsToTarget(points, 600_000)).toBeLessThan(
      yearsToTarget(points, 900_000),
    );
  });

  it("agrees with the projection once debt is in play", () => {
    const points = generateProjection({
      ...base,
      liabilities: [
        { balance: 400_000, interestRate: 0.06, annualPayment: 36_000 },
      ],
    });
    const target = 1_000_000;
    const years = yearsToTarget(points, target);
    const crossing = points.find((p) => p.netWorth >= target)!;

    // The interpolated answer sits in the year before the first crossing.
    expect(years).toBeGreaterThan(crossing.year - 1);
    expect(years).toBeLessThanOrEqual(crossing.year);
  });
});
