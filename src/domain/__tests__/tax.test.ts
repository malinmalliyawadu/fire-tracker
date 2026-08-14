import { describe, expect, it } from "vitest";

import {
  accLevy,
  ACC_EARNER_LEVY_RATE,
  ACC_MAX_LIABLE_EARNINGS,
  afterTaxReturn,
  blendedAfterTaxReturn,
  esctRate,
  FAIR_DIVIDEND_RATE,
  governmentContribution,
  GOVT_CONTRIBUTION_INCOME_CAP,
  GOVT_CONTRIBUTION_MAX,
  marginalRate,
  payeTax,
  prescribedInvestorRate,
} from "../tax";

describe("payeTax", () => {
  it("is zero for no income", () => {
    expect(payeTax(0)).toBe(0);
    expect(payeTax(-100)).toBe(0);
  });

  it("taxes the first band at 10.5%", () => {
    expect(payeTax(10_000)).toBeCloseTo(1_050, 2);
    expect(payeTax(15_600)).toBeCloseTo(1_638, 2);
  });

  it("is progressive, not a flat rate on the whole amount", () => {
    // 15,600 @ 10.5% + 4,400 @ 17.5%
    expect(payeTax(20_000)).toBeCloseTo(1_638 + 770, 2);
  });

  it("stacks every band for a high income", () => {
    const expected =
      15_600 * 0.105 +
      (53_500 - 15_600) * 0.175 +
      (78_100 - 53_500) * 0.3 +
      (180_000 - 78_100) * 0.33 +
      20_000 * 0.39;

    expect(payeTax(200_000)).toBeCloseTo(expected, 2);
  });

  it("never taxes more than it earns", () => {
    for (const income of [1_000, 20_000, 60_000, 120_000, 300_000]) {
      expect(payeTax(income)).toBeLessThan(income);
    }
  });

  it("increases monotonically with income", () => {
    let previous = 0;

    for (const income of [10_000, 30_000, 60_000, 90_000, 200_000]) {
      const tax = payeTax(income);

      expect(tax).toBeGreaterThan(previous);
      previous = tax;
    }
  });
});

describe("accLevy", () => {
  it("applies the levy rate below the cap", () => {
    expect(accLevy(50_000)).toBeCloseTo(50_000 * ACC_EARNER_LEVY_RATE, 4);
  });

  it("caps at the maximum liable earnings", () => {
    const capped = ACC_MAX_LIABLE_EARNINGS * ACC_EARNER_LEVY_RATE;

    expect(accLevy(ACC_MAX_LIABLE_EARNINGS + 100_000)).toBeCloseTo(capped, 4);
  });

  it("is zero without salary income", () => {
    expect(accLevy(0)).toBe(0);
  });
});

describe("marginalRate", () => {
  it("returns the band the next dollar falls in", () => {
    expect(marginalRate(10_000)).toBe(0.105);
    expect(marginalRate(40_000)).toBe(0.175);
    expect(marginalRate(60_000)).toBe(0.3);
    expect(marginalRate(100_000)).toBe(0.33);
    expect(marginalRate(250_000)).toBe(0.39);
  });
});

describe("prescribedInvestorRate", () => {
  it("gives the lowest rate to low earners", () => {
    expect(prescribedInvestorRate(12_000)).toBe(0.105);
  });

  it("moves up a band when PIE income pushes past the combined cap", () => {
    expect(prescribedInvestorRate(15_000, 0)).toBe(0.105);
    expect(prescribedInvestorRate(15_000, 50_000)).toBe(0.175);
  });

  it("tops out at 28%", () => {
    expect(prescribedInvestorRate(120_000)).toBe(0.28);
    expect(prescribedInvestorRate(60_000)).toBe(0.28);
  });
});

describe("esctRate", () => {
  it("rises with total remuneration", () => {
    expect(esctRate(15_000)).toBe(0.105);
    expect(esctRate(50_000)).toBe(0.175);
    expect(esctRate(80_000)).toBe(0.3);
    expect(esctRate(150_000)).toBe(0.33);
    expect(esctRate(250_000)).toBe(0.39);
  });
});

describe("governmentContribution", () => {
  it("matches 25c per dollar up to the annual maximum", () => {
    expect(governmentContribution(400, 60_000)).toBeCloseTo(100, 2);
    expect(governmentContribution(100_000, 60_000)).toBeCloseTo(
      GOVT_CONTRIBUTION_MAX,
      2,
    );
  });

  it("is zero above the income cap", () => {
    expect(governmentContribution(2_000, GOVT_CONTRIBUTION_INCOME_CAP)).toBe(0);
  });

  it("is zero without member contributions", () => {
    expect(governmentContribution(0, 60_000)).toBe(0);
  });
});

describe("afterTaxReturn", () => {
  const rates = { marginal: 0.33, pir: 0.28 };

  it("taxes interest in full at the marginal rate", () => {
    expect(afterTaxReturn("savings", 0.05, rates)).toBeCloseTo(0.05 * 0.67, 6);
  });

  it("taxes crypto gains as income", () => {
    expect(afterTaxReturn("crypto", 0.1, rates)).toBeCloseTo(0.1 * 0.67, 6);
  });

  it("applies FDR to PIE funds and KiwiSaver", () => {
    const expected = 0.07 - 0.28 * FAIR_DIVIDEND_RATE;

    expect(afterTaxReturn("shares", 0.07, rates)).toBeCloseTo(expected, 6);
    expect(afterTaxReturn("kiwisaver", 0.07, rates)).toBeCloseTo(expected, 6);
  });

  it("FDR is a flat drag — a poor year is taxed the same", () => {
    const good = afterTaxReturn("shares", 0.1, rates);
    const poor = afterTaxReturn("shares", 0.02, rates);

    expect(good - 0.1).toBeCloseTo(poor - 0.02, 6);
  });

  it("FDR can push a weak year below zero", () => {
    // The drag is pir x 5% = 1.4%, so anything under that nets out negative.
    expect(afterTaxReturn("shares", 0.01, rates)).toBeLessThan(0);
    expect(afterTaxReturn("shares", 0.02, rates)).toBeGreaterThan(0);
  });

  it("leaves property growth untaxed", () => {
    expect(afterTaxReturn("property", 0.06, rates)).toBeCloseTo(0.06, 6);
  });
});

describe("blendedAfterTaxReturn", () => {
  const rates = { marginal: 0.33, pir: 0.28 };

  it("returns the pre-tax figure with nothing to weight", () => {
    expect(blendedAfterTaxReturn([], 0.07, rates)).toBe(0.07);
  });

  it("matches the single-asset case for a one-asset portfolio", () => {
    const weights = [{ type: "savings" as const, value: 10_000 }];

    expect(blendedAfterTaxReturn(weights, 0.05, rates)).toBeCloseTo(
      afterTaxReturn("savings", 0.05, rates),
      6,
    );
  });

  it("weights by value, so the big holding dominates", () => {
    const propertyHeavy = blendedAfterTaxReturn(
      [
        { type: "property", value: 900_000 },
        { type: "savings", value: 100_000 },
      ],
      0.06,
      rates,
    );
    const savingsHeavy = blendedAfterTaxReturn(
      [
        { type: "property", value: 100_000 },
        { type: "savings", value: 900_000 },
      ],
      0.06,
      rates,
    );

    expect(propertyHeavy).toBeGreaterThan(savingsHeavy);
  });

  it("never exceeds the pre-tax return", () => {
    const blended = blendedAfterTaxReturn(
      [
        { type: "shares", value: 200_000 },
        { type: "kiwisaver", value: 85_000 },
        { type: "savings", value: 30_000 },
        { type: "property", value: 850_000 },
      ],
      0.07,
      rates,
    );

    expect(blended).toBeLessThan(0.07);
    expect(blended).toBeGreaterThan(0);
  });

  it("ignores negative values rather than letting them skew the weights", () => {
    const blended = blendedAfterTaxReturn(
      [
        { type: "savings", value: -5_000 },
        { type: "property", value: 100_000 },
      ],
      0.06,
      rates,
    );

    expect(blended).toBeCloseTo(0.06, 6);
  });
});
