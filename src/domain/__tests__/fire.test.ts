import type { Asset, Liability } from "@/types";

import { describe, expect, it } from "vitest";

import {
  computeFireTargets,
  countsTowardFire,
  progressPercent,
  unpairedPropertyMortgages,
} from "../fire";

describe("countsTowardFire", () => {
  it("counts anything recorded before the flag existed", () => {
    expect(countsTowardFire({})).toBe(true);
  });

  it("counts an explicit true", () => {
    expect(countsTowardFire({ countsTowardFire: true })).toBe(true);
  });

  it("only an explicit false takes something out of the FIRE picture", () => {
    expect(countsTowardFire({ countsTowardFire: false })).toBe(false);
  });

  it("treats an absent flag as counting, not as unset-and-therefore-out", () => {
    expect(countsTowardFire({ countsTowardFire: undefined })).toBe(true);
  });
});

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

describe("unpairedPropertyMortgages", () => {
  const stamp = "2026-01-01T00:00:00.000Z";
  const asset = (over: Partial<Asset>): Asset => ({
    id: "a",
    name: "Asset",
    type: "property",
    value: 100,
    currency: "NZD",
    contribution: 0,
    frequency: "monthly",
    createdAt: stamp,
    updatedAt: stamp,
    ...over,
  });
  const debt = (over: Partial<Liability>): Liability => ({
    id: "l",
    name: "Loan",
    type: "mortgage",
    balance: 100,
    currency: "NZD",
    interestRate: 0.06,
    payment: 10,
    frequency: "monthly",
    createdAt: stamp,
    updatedAt: stamp,
    ...over,
  });

  it("flags a counted mortgage when a property is excluded", () => {
    const found = unpairedPropertyMortgages(
      [asset({ countsTowardFire: false })],
      [debt({ id: "m1" })],
    );

    expect(found.map((l) => l.id)).toEqual(["m1"]);
  });

  it("stays quiet when every property counts", () => {
    expect(unpairedPropertyMortgages([asset({})], [debt({})])).toEqual([]);
  });

  it("stays quiet once the mortgage is excluded too", () => {
    const found = unpairedPropertyMortgages(
      [asset({ countsTowardFire: false })],
      [debt({ countsTowardFire: false })],
    );

    expect(found).toEqual([]);
  });

  it("ignores debts that aren't mortgages", () => {
    const found = unpairedPropertyMortgages(
      [asset({ countsTowardFire: false })],
      [debt({ id: "car", type: "car-loan" })],
    );

    expect(found).toEqual([]);
  });

  it("returns only the counted mortgages when some are already excluded", () => {
    const found = unpairedPropertyMortgages(
      [asset({ countsTowardFire: false })],
      [
        debt({ id: "m1" }),
        debt({ id: "m2", countsTowardFire: false }),
        debt({ id: "m3" }),
      ],
    );

    expect(found.map((l) => l.id)).toEqual(["m1", "m3"]);
  });

  it("an excluded non-property asset doesn't implicate a mortgage", () => {
    const found = unpairedPropertyMortgages(
      [asset({ type: "other", countsTowardFire: false })],
      [debt({})],
    );

    expect(found).toEqual([]);
  });
});
