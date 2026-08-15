import type { Settings } from "@/types";

import { describe, expect, it } from "vitest";

import { computeFireTargets } from "../fire";
import { buildAccumulationProjection, buildProjection } from "../plan";
import { yearsToTarget } from "../projection";

const settings: Settings = {
  displayCurrency: "NZD",
  currentAge: 35,
  retirementAge: 55,
  annualExpenses: 90_000,
  withdrawalRate: 0.04,
  expectedReturn: 0.054,
  inflationRate: 0.025,
  nzSuperAnnual: 28_000,
  nzSuperStartAge: 65,
  kiwisaverUnlockAge: 65,
  usdToNzd: 1.65,
  applyInvestmentTax: false,
  nzSuperStatus: "singleLivingAlone",
  household: {
    hasPartner: false,
    partnerAge: 35,
    includePartnerNzSuper: false,
  },
  spendingPhases: {
    enabled: false,
    goGoMultiplier: 1.1,
    slowGoFromAge: 75,
    slowGoMultiplier: 0.9,
    noGoFromAge: 85,
    noGoMultiplier: 0.85,
  },
};

// Reaches the Traditional target a couple of years after the retirement age,
// which is the case the retirement projection reported as never reached.
const bundle = {
  currentNetWorth: 400_000,
  monthlySavings: 4_000,
  expectedReturn: settings.expectedReturn,
  retirementAge: settings.retirementAge,
};

const traditional = computeFireTargets({
  annualExpenses: settings.annualExpenses,
  withdrawalRate: settings.withdrawalRate,
  expectedReturn: settings.expectedReturn,
  inflationRate: settings.inflationRate,
  currentAge: settings.currentAge,
  retirementAge: settings.retirementAge,
}).traditional;

describe("buildAccumulationProjection", () => {
  it("keeps contributing past the retirement age", () => {
    const points = buildAccumulationProjection(bundle, settings, 60);
    const atRetirement = points.findIndex((p) => p.age === 55);

    expect(points).toHaveLength(61);
    // Every year still grows — no drawdown anywhere in the horizon.
    for (let i = atRetirement + 1; i < points.length; i++) {
      expect(points[i].netWorth).toBeGreaterThan(points[i - 1].netWorth);
    }
  });

  it("reaches a target the retirement projection never does", () => {
    const retiring = yearsToTarget(
      buildProjection(bundle, settings, 60),
      traditional,
    );
    const accumulating = yearsToTarget(
      buildAccumulationProjection(bundle, settings, 60),
      traditional,
    );

    // The old reading: retire at 55 with the pot short, draw down, never
    // touch the number again.
    expect(retiring).toBe(Infinity);
    // The honest one: a few more years of contributions gets there.
    expect(accumulating).toBeGreaterThan(20);
    expect(accumulating).toBeLessThan(25);
  });

  it("agrees with the retirement projection before retirement", () => {
    const retiring = buildProjection(bundle, settings, 60);
    const accumulating = buildAccumulationProjection(bundle, settings, 60);

    for (let i = 0; i <= 20; i++) {
      expect(accumulating[i].netWorth).toBe(retiring[i].netWorth);
    }
  });

  it("still reports Infinity for a genuinely unreachable target", () => {
    const points = buildAccumulationProjection(bundle, settings, 60);

    expect(yearsToTarget(points, 500_000_000)).toBe(Infinity);
  });
});
