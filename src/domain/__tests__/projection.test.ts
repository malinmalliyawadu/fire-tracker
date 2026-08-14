import { describe, expect, it } from "vitest";

import {
  coastPoint,
  generateProjection,
  spendingMultiplier,
  yearsToPayoff,
  yearsToTarget,
} from "../projection";

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

    describe("external liabilities", () => {
      const external = { ...base, externalLiabilities: [mortgage] };

      it("leaves starting net worth alone — it was never netted off", () => {
        const points = generateProjection(external);

        expect(points[0].netWorth).toBe(base.currentNetWorth);
      });

      it("stays out of the reported debt line", () => {
        const points = generateProjection(external);

        expect(points.every((p) => p.debt === 0)).toBe(true);
      });

      it("costs the portfolio in retirement, unlike being left out", () => {
        const retiring = { ...base, retirementAge: 30 };
        const serviced = generateProjection({
          ...retiring,
          externalLiabilities: [mortgage],
        });
        const ignored = generateProjection(retiring);

        expect(serviced[10].netWorth).toBeLessThan(ignored[10].netWorth);
      });

      it("frees its repayment into savings once it clears", () => {
        // A loan small enough to clear quickly, then the payment is investable.
        const small = {
          balance: 10_000,
          interestRate: 0.05,
          annualPayment: 12_000,
        };
        const withLoan = generateProjection({
          ...base,
          externalLiabilities: [small],
        });

        expect(withLoan[40].netWorth).toBeGreaterThan(
          generateProjection(base)[40].netWorth,
        );
      });

      it("nets and reports only the netted debt when both kinds are present", () => {
        const points = generateProjection({
          ...base,
          liabilities: [mortgage],
          externalLiabilities: [mortgage],
        });

        expect(points[0].netWorth).toBe(base.currentNetWorth);
        expect(points[0].debt).toBe(mortgage.balance);
      });
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

describe("spendingMultiplier", () => {
  const phases = {
    enabled: true,
    goGoMultiplier: 1.1,
    slowGoFromAge: 75,
    slowGoMultiplier: 0.9,
    noGoFromAge: 85,
    noGoMultiplier: 0.85,
  };

  it("is 1 when phases are disabled or absent", () => {
    expect(spendingMultiplier(80, { ...phases, enabled: false })).toBe(1);
    expect(spendingMultiplier(80, undefined)).toBe(1);
  });

  it("picks the band the age falls in", () => {
    expect(spendingMultiplier(66, phases)).toBe(1.1);
    expect(spendingMultiplier(74, phases)).toBe(1.1);
    expect(spendingMultiplier(75, phases)).toBe(0.9);
    expect(spendingMultiplier(84, phases)).toBe(0.9);
    expect(spendingMultiplier(85, phases)).toBe(0.85);
    expect(spendingMultiplier(100, phases)).toBe(0.85);
  });
});

describe("retirement spending", () => {
  const base = {
    currentNetWorth: 2_000_000,
    monthlySavings: 0,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 65,
    retirementAge: 65,
    annualExpenses: 60_000,
    years: 30,
  };

  it("uses retirementExpenses instead of annualExpenses once retired", () => {
    const flat = generateProjection(base);
    const cheaper = generateProjection({ ...base, retirementExpenses: 40_000 });
    const at75 = cheaper.find((p) => p.age === 75)!;
    const at75Flat = flat.find((p) => p.age === 75)!;

    expect(at75.withdrawn).toBeLessThan(at75Flat.withdrawn);
    expect(at75.netWorth).toBeGreaterThan(at75Flat.netWorth);
  });

  it("falls back to annualExpenses when retirementExpenses is absent", () => {
    const implicit = generateProjection(base);
    const explicit = generateProjection({
      ...base,
      retirementExpenses: base.annualExpenses,
    });

    expect(implicit.at(-1)!.netWorth).toBe(explicit.at(-1)!.netWorth);
  });

  it("spending phases reduce withdrawals in the later years", () => {
    const flat = generateProjection(base);
    const phased = generateProjection({
      ...base,
      spendingPhases: {
        enabled: true,
        goGoMultiplier: 1,
        slowGoFromAge: 75,
        slowGoMultiplier: 0.8,
        noGoFromAge: 85,
        noGoMultiplier: 0.7,
      },
    });

    const at74 = phased.find((p) => p.age === 74)!;
    const at74Flat = flat.find((p) => p.age === 74)!;
    const at90 = phased.find((p) => p.age === 90)!;
    const at90Flat = flat.find((p) => p.age === 90)!;

    // Identical while the multiplier is 1, better once it drops.
    expect(at74.withdrawn).toBeCloseTo(at74Flat.withdrawn, 0);
    expect(at90.withdrawn).toBeLessThan(at90Flat.withdrawn);
  });
});

describe("one-off events", () => {
  const base = {
    currentNetWorth: 300_000,
    monthlySavings: 2_000,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 35,
    retirementAge: 65,
    annualExpenses: 50_000,
    years: 20,
  };

  it("a cost dents the portfolio from the year it lands", () => {
    const withoutEvent = generateProjection(base);
    const withEvent = generateProjection({
      ...base,
      oneOffByYear: [0, 0, 0, 100_000],
    });

    expect(withEvent[3].netWorth).toBe(withoutEvent[3].netWorth);
    expect(withEvent[4].netWorth).toBeLessThan(withoutEvent[4].netWorth);
  });

  it("a windfall lifts it", () => {
    const withoutEvent = generateProjection(base);
    const withWindfall = generateProjection({
      ...base,
      oneOffByYear: [0, 0, -50_000],
    });

    expect(withWindfall[5].netWorth).toBeGreaterThan(withoutEvent[5].netWorth);
  });

  it("events after retirement come out of withdrawals", () => {
    const retired = { ...base, currentAge: 65, retirementAge: 65 };
    const withoutEvent = generateProjection(retired);
    const withEvent = generateProjection({
      ...retired,
      oneOffByYear: [30_000],
    });

    expect(withEvent[1].withdrawn).toBeGreaterThan(withoutEvent[1].withdrawn);
  });

  it("ignores years beyond the array", () => {
    const short = generateProjection({ ...base, oneOffByYear: [0, 5_000] });

    expect(short).toHaveLength(21);
    expect(Number.isFinite(short.at(-1)!.netWorth)).toBe(true);
  });
});

describe("kid costs by year", () => {
  const base = {
    currentNetWorth: 300_000,
    monthlySavings: 2_000,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 35,
    retirementAge: 65,
    annualExpenses: 50_000,
    years: 20,
  };

  it("only bites in the years with a cost", () => {
    const none = generateProjection(base);
    const withKids = generateProjection({
      ...base,
      kidsCostByYear: [0, 0, 15_000, 15_000],
    });

    expect(withKids[2].netWorth).toBe(none[2].netWorth);
    expect(withKids[5].netWorth).toBeLessThan(none[5].netWorth);
  });

  it("a longer cost curve costs more overall", () => {
    const short = generateProjection({
      ...base,
      kidsCostByYear: Array(5).fill(15_000),
    });
    const long = generateProjection({
      ...base,
      kidsCostByYear: Array(18).fill(15_000),
    });

    expect(long.at(-1)!.netWorth).toBeLessThan(short.at(-1)!.netWorth);
  });
});

describe("coastPoint", () => {
  const base = {
    currentNetWorth: 100_000,
    monthlySavings: 2_000,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 30,
    retirementAge: 65,
    annualExpenses: 40_000,
    years: 40,
  };
  const realReturn = base.expectedReturn - base.inflationRate;

  it("returns null for a target that's never coastable", () => {
    const points = generateProjection(base);

    expect(coastPoint(points, 500_000_000, realReturn, 65)).toBeNull();
  });

  it("returns null for a non-positive target", () => {
    expect(coastPoint(generateProjection(base), 0, realReturn, 65)).toBeNull();
  });

  it("says 'now' when today's net worth already coasts there", () => {
    const points = generateProjection(base);
    // 100k compounding for 35 years at 4.5% lands well above 300k.
    const coast = coastPoint(points, 300_000, realReturn, 65);

    expect(coast).not.toBeNull();
    expect(coast!.year).toBe(0);
  });

  it("arrives before the target itself is reached", () => {
    const points = generateProjection(base);
    const target = 1_000_000;
    const coast = coastPoint(points, target, realReturn, 65);
    const reached = yearsToTarget(points, target);

    expect(coast).not.toBeNull();
    expect(coast!.year).toBeLessThan(reached);
  });

  it("a bigger target takes longer to coast to", () => {
    const points = generateProjection(base);
    const early = coastPoint(points, 800_000, realReturn, 65)!;
    const later = coastPoint(points, 1_500_000, realReturn, 65)!;

    expect(later.year).toBeGreaterThan(early.year);
  });

  it("retiring earlier leaves less time to coast, so it takes longer", () => {
    const points = generateProjection(base);
    const to65 = coastPoint(points, 1_000_000, realReturn, 65)!;
    const to55 = coastPoint(points, 1_000_000, realReturn, 55)!;

    expect(to55.year).toBeGreaterThan(to65.year);
  });
});

describe("barista income and partner Super", () => {
  const early = {
    currentNetWorth: 900_000,
    monthlySavings: 0,
    expectedReturn: 0.07,
    inflationRate: 0.025,
    currentAge: 50,
    retirementAge: 50,
    annualExpenses: 55_000,
    years: 45,
  };

  it("part-time income reduces early withdrawals", () => {
    const without = generateProjection(early);
    const withBarista = generateProjection({
      ...early,
      baristaIncomeAnnual: 25_000,
      baristaUntilAge: 60,
    });
    const at55 = withBarista.find((p) => p.age === 55)!;
    const at55Without = without.find((p) => p.age === 55)!;

    expect(at55.withdrawn).toBeLessThan(at55Without.withdrawn);
    expect(at55.netWorth).toBeGreaterThan(at55Without.netWorth);
  });

  it("part-time income stops at the given age", () => {
    const points = generateProjection({
      ...early,
      baristaIncomeAnnual: 25_000,
      baristaUntilAge: 60,
    });
    const at61 = points.find((p) => p.age === 61)!;
    const at62 = points.find((p) => p.age === 62)!;

    // Full expenses again once the part-time work ends.
    expect(at62.withdrawn - at61.withdrawn).toBeCloseTo(55_000, 0);
  });

  it("a partner's Super starts on its own schedule", () => {
    const solo = generateProjection({
      ...early,
      nzSuperAnnualInDisplay: 21_000,
      nzSuperStartAge: 65,
    });
    const couple = generateProjection({
      ...early,
      nzSuperAnnualInDisplay: 21_000,
      nzSuperStartAge: 65,
      partnerNzSuperAnnual: 21_000,
      // Partner is five years younger, so their Super lands when you're 70.
      partnerNzSuperStartAge: 70,
    });

    const at67 = couple.find((p) => p.age === 67)!;
    const at67Solo = solo.find((p) => p.age === 67)!;
    const at75 = couple.find((p) => p.age === 75)!;
    const at75Solo = solo.find((p) => p.age === 75)!;

    // Identical before the partner qualifies, better afterwards.
    expect(at67.netWorth).toBe(at67Solo.netWorth);
    expect(at75.netWorth).toBeGreaterThan(at75Solo.netWorth);
  });
});

describe("yearsToPayoff", () => {
  it("a cleared balance is already paid off", () => {
    expect(yearsToPayoff(0, 0.06, 12_000)).toBe(0);
  });

  it("never pays off without a payment", () => {
    expect(yearsToPayoff(100_000, 0.06, 0)).toBe(Infinity);
  });

  it("never pays off when the payment can't cover the interest", () => {
    // 5% on 100k is 5,000 a year; paying 3,000 lets the balance grow.
    expect(yearsToPayoff(100_000, 0.05, 3_000)).toBe(Infinity);
  });

  it("an interest-free loan clears at balance / payment", () => {
    expect(yearsToPayoff(10_000, 0, 5_000)).toBeCloseTo(2, 2);
  });

  it("interest pushes the payoff date out", () => {
    const free = yearsToPayoff(300_000, 0, 30_000);
    const charged = yearsToPayoff(300_000, 0.06, 30_000);

    expect(charged).toBeGreaterThan(free);
    expect(charged).toBeLessThan(20);
  });

  it("agrees with the balance the projection actually reports", () => {
    const loan = {
      balance: 300_000,
      interestRate: 0.06,
      annualPayment: 30_000,
    };
    const points = generateProjection({
      currentNetWorth: 0,
      monthlySavings: 0,
      expectedReturn: 0.07,
      inflationRate: 0,
      currentAge: 30,
      retirementAge: 65,
      annualExpenses: 0,
      years: 40,
      liabilities: [loan],
    });

    const years = yearsToPayoff(
      loan.balance,
      loan.interestRate,
      loan.annualPayment,
    );
    const clearedAt = points.findIndex((p) => p.debt === 0);

    expect(clearedAt).toBe(Math.ceil(years));
  });

  it("gives up rather than looping forever on a barely-covering payment", () => {
    expect(yearsToPayoff(1_000_000, 0.06, 60_100, 5)).toBe(Infinity);
  });
});
