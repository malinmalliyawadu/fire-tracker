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
  afterTaxReturn: 0.07,
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

  it("shows the working from expected return down to the gap", () => {
    const warning = checkAssumptions({
      ...healthy,
      afterTaxReturn: 0.052,
      realReturn: 0.027,
      investmentTax: {
        rates: { marginal: 0.33, pir: 0.28 },
        slices: [
          {
            rule: "pie",
            types: ["shares", "kiwisaver"],
            share: 0.72,
            drag: 0.01,
          },
          { rule: "income", types: ["savings"], share: 0.08, drag: 0.008 },
          { rule: "untaxed", types: ["property"], share: 0.2, drag: 0 },
        ],
      },
    }).find((w) => w.id === "withdrawal-exceeds-return");

    expect(warning?.detail).toContain("after tax and inflation");
    expect(
      warning?.calculation?.map((line) => [line.label, line.value]),
    ).toEqual([
      ["Expected return", "7.0%"],
      ["Investment tax", "−1.8%"],
      ["Return after tax", "5.2%"],
      ["Inflation", "−2.5%"],
      ["Real return", "2.7%"],
      ["Withdrawal rate", "4.0%"],
      ["Drawn from capital", "1.3% a year"],
    ]);
    expect(warning?.calculation?.at(-1)?.note).toContain(
      "On the $1.5M target that is $19.5K of capital spent in year one.",
    );
  });

  it("says where the tax comes from, holding by holding", () => {
    const warning = checkAssumptions({
      ...healthy,
      afterTaxReturn: 0.052,
      realReturn: 0.027,
      investmentTax: {
        rates: { marginal: 0.33, pir: 0.175 },
        slices: [
          {
            rule: "pie",
            types: ["shares", "kiwisaver"],
            share: 0.72,
            drag: 0.01,
          },
          { rule: "income", types: ["savings"], share: 0.08, drag: 0.008 },
          { rule: "untaxed", types: ["property"], share: 0.2, drag: 0 },
        ],
      },
    }).find((w) => w.id === "withdrawal-exceeds-return");
    const note = warning?.calculation?.find(
      (line) => line.label === "Investment tax",
    )?.note;

    expect(note).toBe(
      "Shares and KiwiSaver, 72% of the pot: 5% of value is deemed income each year and taxed at your 17.5% PIR, costing 1.0%. " +
        "Savings, 8% of the pot: the whole return is taxed as income at your 33% marginal rate, costing 0.8%. " +
        "Property, 20% of the pot: growth is untaxed. " +
        "Set under Investment tax in Settings.",
    );
  });

  it("spells out what real return is taken from", () => {
    const notes = (afterTaxReturn: number) =>
      checkAssumptions({ ...healthy, afterTaxReturn, realReturn: 0.027 })
        .find((w) => w.id === "withdrawal-exceeds-return")
        ?.calculation?.find((line) => line.label === "Real return")?.note;

    expect(notes(0.052)).toContain("Return after tax less inflation");
    expect(notes(0.07)).toContain("Expected return less inflation");
  });

  it("leaves tax out of the working when it takes nothing off", () => {
    const warning = checkAssumptions({
      ...healthy,
      settings: { ...settings, withdrawalRate: 0.06 },
      realReturn: 0.045,
    }).find((w) => w.id === "withdrawal-exceeds-return");

    expect(warning?.detail).toContain("after inflation");
    expect(warning?.calculation?.map((line) => line.label)).toEqual([
      "Expected return",
      "Inflation",
      "Real return",
      "Withdrawal rate",
      "Drawn from capital",
    ]);
  });

  it("skips the dollar figure when there is no retirement spending", () => {
    const warning = checkAssumptions({
      ...healthy,
      retirementExpenses: 0,
      realReturn: 0.027,
    }).find((w) => w.id === "withdrawal-exceeds-return");

    expect(warning?.calculation?.at(-1)?.note).not.toContain("target");
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

  it("warns when a property is excluded but its mortgage still counts", () => {
    expect(ids({ ...healthy, hasUnpairedPropertyDebt: true })).toContain(
      "unpaired-property-debt",
    );
    expect(ids(healthy)).not.toContain("unpaired-property-debt");
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
