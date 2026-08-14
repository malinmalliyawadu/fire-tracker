import type { Settings } from "@/types";

import { describe, expect, it } from "vitest";

import { checkAssumptions } from "../sanity";

const settings: Settings = {
  displayCurrency: "NZD",
  currentAge: 38,
  retirementAge: 55,
  annualExpenses: 60_000,
  withdrawalRate: 0.04,
  expectedReturn: 0.07,
  inflationRate: 0.025,
  nzSuperAnnual: 28_000,
  nzSuperStartAge: 65,
  kiwisaverUnlockAge: 65,
  usdToNzd: 1.65,
  applyInvestmentTax: true,
  nzSuperStatus: "singleLivingAlone",
  household: { hasPartner: false, partnerAge: 38, includePartnerNzSuper: true },
  spendingPhases: {
    enabled: false,
    goGoMultiplier: 1.1,
    slowGoFromAge: 75,
    slowGoMultiplier: 0.9,
    noGoFromAge: 85,
    noGoMultiplier: 0.85,
  },
};

const healthy = {
  settings,
  realReturn: 0.045,
  retirementExpenses: 60_000,
  savingsRate: 0.35,
  hasIncome: true,
  topAssetShare: 0.4,
  hasNegativeAmortisation: false,
};

const ids = (input: Parameters<typeof checkAssumptions>[0]) =>
  checkAssumptions(input).map((w) => w.id);

describe("checkAssumptions", () => {
  it("says nothing about a sensible plan", () => {
    expect(checkAssumptions(healthy)).toEqual([]);
  });

  it("flags a withdrawal rate above the real return", () => {
    expect(
      ids({
        ...healthy,
        settings: { ...settings, withdrawalRate: 0.06 },
        realReturn: 0.045,
      }),
    ).toContain("withdrawal-exceeds-return");
  });

  it("flags an optimistic return", () => {
    expect(
      ids({
        ...healthy,
        settings: { ...settings, expectedReturn: 0.12 },
        realReturn: 0.095,
      }),
    ).toContain("optimistic-return");
  });

  it("flags zero inflation", () => {
    expect(
      ids({ ...healthy, settings: { ...settings, inflationRate: 0 } }),
    ).toContain("no-inflation");
  });

  it("flags a retirement age that isn't in the future", () => {
    expect(
      ids({ ...healthy, settings: { ...settings, retirementAge: 38 } }),
    ).toContain("retirement-not-future");
  });

  it("flags missing retirement spending", () => {
    expect(ids({ ...healthy, retirementExpenses: 0 })).toContain("no-expenses");
  });

  it("flags saving nothing, but only once income exists", () => {
    expect(ids({ ...healthy, savingsRate: 0 })).toContain("no-savings");
    expect(ids({ ...healthy, savingsRate: 0, hasIncome: false })).not.toContain(
      "no-savings",
    );
  });

  it("notes an implausibly high savings rate", () => {
    expect(ids({ ...healthy, savingsRate: 0.85 })).toContain(
      "very-high-savings",
    );
  });

  it("notes a concentrated portfolio", () => {
    expect(ids({ ...healthy, topAssetShare: 0.8 })).toContain("concentrated");
  });

  it("notes a loan still being repaid after retirement", () => {
    expect(ids({ ...healthy, hasDebtPastRetirement: true })).toContain(
      "debt-past-retirement",
    );
    expect(ids(healthy)).not.toContain("debt-past-retirement");
  });

  it("flags a loan that never pays down", () => {
    expect(ids({ ...healthy, hasNegativeAmortisation: true })).toContain(
      "negative-amortisation",
    );
  });

  it("separates hard warnings from softer notes", () => {
    const warnings = checkAssumptions({
      ...healthy,
      settings: { ...settings, withdrawalRate: 0.055 },
      realReturn: 0.045,
      topAssetShare: 0.9,
    });

    expect(
      warnings.find((w) => w.id === "withdrawal-exceeds-return")?.level,
    ).toBe("warning");
    expect(warnings.find((w) => w.id === "concentrated")?.level).toBe("note");
  });

  it("can report several problems at once", () => {
    const found = ids({
      ...healthy,
      settings: {
        ...settings,
        withdrawalRate: 0.07,
        expectedReturn: 0.13,
        inflationRate: 0,
      },
      realReturn: 0.13,
      retirementExpenses: 0,
    });

    expect(found.length).toBeGreaterThan(2);
    expect(found).toContain("optimistic-return");
    expect(found).toContain("no-inflation");
    expect(found).toContain("no-expenses");
  });
});
