import type { Asset, Liability, Settings } from "@/types";

import { describe, expect, it } from "vitest";

import { buildSnapshotMarkdown } from "../export";

const settings: Settings = {
  displayCurrency: "NZD",
  currentAge: 38,
  retirementAge: 55,
  annualExpenses: 65_000,
  withdrawalRate: 0.04,
  expectedReturn: 0.07,
  inflationRate: 0.025,
  nzSuperAnnual: 28_000,
  nzSuperStartAge: 65,
  kiwisaverUnlockAge: 65,
  usdToNzd: 1.65,
  applyInvestmentTax: false,
};

const stamp = "2026-01-01T00:00:00.000Z";

const assets: Asset[] = [
  {
    id: "a1",
    name: "Simplicity Growth",
    type: "kiwisaver",
    value: 85_000,
    currency: "NZD",
    contribution: 600,
    frequency: "monthly",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "a2",
    name: "Global Shares",
    type: "shares",
    value: 220_000,
    currency: "NZD",
    contribution: 2_000,
    frequency: "monthly",
    createdAt: stamp,
    updatedAt: stamp,
  },
];

const liabilities: Liability[] = [
  {
    id: "l1",
    name: "Mortgage",
    type: "mortgage",
    balance: 520_000,
    currency: "NZD",
    interestRate: 0.062,
    payment: 750,
    frequency: "weekly",
    createdAt: stamp,
    updatedAt: stamp,
  },
];

describe("buildSnapshotMarkdown", () => {
  const base = { settings, assets, liabilities, scenarios: [] };

  it("reports net worth as assets minus liabilities", () => {
    const md = buildSnapshotMarkdown(base);

    // 305,000 assets − 520,000 mortgage
    expect(md).toContain("Net worth: -$215,000");
  });

  it("lists every asset and liability", () => {
    const md = buildSnapshotMarkdown(base);

    expect(md).toContain("Simplicity Growth");
    expect(md).toContain("Global Shares");
    expect(md).toContain("Mortgage");
    expect(md).toContain("## Assets (2)");
    expect(md).toContain("## Liabilities (1)");
  });

  it("documents how liabilities are modelled", () => {
    const md = buildSnapshotMarkdown(base);

    expect(md).toContain("Liabilities amortise monthly");
    expect(md).toContain("excluding");
  });

  it("gives every FIRE type a time-to-reach figure", () => {
    const md = buildSnapshotMarkdown(base);
    const rows = md
      .split("\n")
      .filter(
        (line) => line.startsWith("| Traditional") || line.startsWith("| Lean"),
      );

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.split("|").at(-2)!.trim()).not.toBe("");
    }
  });

  it("a mortgage pushes the FIRE date out", () => {
    // Retire later and spend less, so the target is actually reachable and
    // the two runs produce comparable figures rather than both being ∞.
    const reachable = {
      ...base,
      settings: { ...settings, retirementAge: 65, annualExpenses: 40_000 },
    };
    const yearsIn = (md: string): string =>
      md
        .split("\n")
        .find((line) => line.startsWith("| Traditional"))!
        .split("|")
        .at(-2)!
        .trim();

    const withMortgage = yearsIn(buildSnapshotMarkdown(reachable));
    const debtFree = yearsIn(
      buildSnapshotMarkdown({ ...reachable, liabilities: [] }),
    );

    expect(withMortgage).not.toBe("∞");
    expect(debtFree).not.toBe("∞");
    expect(withMortgage).not.toBe(debtFree);
  });

  it("handles an empty portfolio without throwing", () => {
    const md = buildSnapshotMarkdown({
      settings,
      assets: [],
      liabilities: [],
      scenarios: [],
    });

    expect(md).toContain("_No assets recorded._");
    expect(md).toContain("_No liabilities recorded._");
    expect(md).toContain("_No scenarios saved yet._");
  });
});
