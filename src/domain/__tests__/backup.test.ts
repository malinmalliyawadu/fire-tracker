import { describe, expect, it } from "vitest";

import { parseBackup } from "../backup";

const stamp = "2026-01-01T00:00:00.000Z";

const asset = {
  id: "a1",
  name: "Shares",
  type: "shares",
  value: 100_000,
  currency: "NZD",
  contribution: 500,
  frequency: "monthly",
  createdAt: stamp,
  updatedAt: stamp,
};

const validBackup = {
  generatedAt: stamp,
  settings: { currentAge: 40, displayCurrency: "NZD" },
  assets: [asset],
  liabilities: [],
  income: [],
  expenses: [],
  events: [],
  kids: [],
  scenarios: [],
  history: [],
};

describe("parseBackup", () => {
  it("rejects text that isn't JSON", () => {
    const result = parseBackup("not json at all");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JSON/i);
  });

  it("rejects a JSON array at the top level", () => {
    const result = parseBackup("[1, 2, 3]");

    expect(result.ok).toBe(false);
  });

  it("rejects a file with nothing recognisable in it", () => {
    const result = parseBackup(JSON.stringify({ unrelated: "data" }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/nothing would be restored/i);
  });

  it("accepts a well-formed backup and counts what's in it", () => {
    const result = parseBackup(JSON.stringify(validBackup));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.assets).toBe(1);
    expect(result.summary.hasSettings).toBe(true);
    expect(result.summary.generatedAt).toBe(stamp);
    expect(result.payload.assets?.[0].name).toBe("Shares");
  });

  it("accepts a settings-only backup", () => {
    const result = parseBackup(
      JSON.stringify({ settings: { currentAge: 30 } }),
    );

    expect(result.ok).toBe(true);
  });

  it("drops malformed rows but keeps the good ones", () => {
    const result = parseBackup(
      JSON.stringify({
        ...validBackup,
        assets: [
          asset,
          { id: "bad", name: "No value" },
          { name: "No id", value: 1, currency: "NZD", contribution: 0 },
          { ...asset, id: "a2", value: "not a number" },
          { ...asset, id: "a3", currency: "GBP" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Only the one fully-valid asset survives.
    expect(result.summary.assets).toBe(1);
    expect(result.payload.assets?.[0].id).toBe("a1");
  });

  it("round-trips an explicit countsTowardFire flag", () => {
    const result = parseBackup(
      JSON.stringify({
        ...validBackup,
        assets: [
          { ...asset, countsTowardFire: false },
          { ...asset, id: "a2", countsTowardFire: true },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.assets?.[0].countsTowardFire).toBe(false);
    expect(result.payload.assets?.[1].countsTowardFire).toBe(true);
  });

  it("drops a non-boolean countsTowardFire rather than the whole row", () => {
    const result = parseBackup(
      JSON.stringify({
        ...validBackup,
        assets: [{ ...asset, countsTowardFire: "nope" }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The holding survives, and falls back to counting.
    expect(result.summary.assets).toBe(1);
    expect(result.payload.assets?.[0]).not.toHaveProperty("countsTowardFire");
  });

  it("ignores lists that aren't arrays", () => {
    const result = parseBackup(
      JSON.stringify({ ...validBackup, liabilities: "oops", kids: 42 }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.liabilities).toBe(0);
    expect(result.summary.kids).toBe(0);
  });

  it("strips settings values that would break the projection", () => {
    const result = parseBackup(
      JSON.stringify({
        settings: {
          currentAge: "forty",
          retirementAge: 65,
          expectedReturn: null,
          displayCurrency: "GBP",
        },
        assets: [asset],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.settings).not.toHaveProperty("currentAge");
    expect(result.payload.settings).not.toHaveProperty("expectedReturn");
    expect(result.payload.settings).not.toHaveProperty("displayCurrency");
    expect(result.payload.settings?.retirementAge).toBe(65);
  });

  it("keeps NaN and Infinity out of settings", () => {
    // JSON.parse can't produce these, but a hand-edited file routed through
    // another tool can, so the guard is on the value not the syntax.
    const result = parseBackup('{"settings":{"usdToNzd":1e999},"assets":[]}');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.settings).not.toHaveProperty("usdToNzd");
  });

  it("round-trips every list it knows about", () => {
    const full = {
      ...validBackup,
      liabilities: [
        {
          id: "l1",
          name: "Mortgage",
          type: "mortgage",
          balance: 400_000,
          currency: "NZD",
          interestRate: 0.06,
          payment: 3_000,
          frequency: "monthly",
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
      income: [
        {
          id: "i1",
          name: "Job",
          type: "salary",
          amount: 120_000,
          currency: "NZD",
          frequency: "annually",
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
      expenses: [
        {
          id: "e1",
          name: "Food",
          category: "food",
          amount: 1_200,
          currency: "NZD",
          frequency: "monthly",
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
      events: [
        {
          id: "ev1",
          name: "Car",
          year: 2030,
          amount: 30_000,
          currency: "NZD",
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
      kids: [
        {
          id: "k1",
          name: "Ana",
          birthYear: 2020,
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
      scenarios: [
        { id: "s1", name: "Lean", color: "#fff", inputs: {}, createdAt: stamp },
      ],
      history: [
        {
          id: "h1",
          date: stamp,
          netWorth: 500_000,
          assetsTotal: 900_000,
          liabilitiesTotal: 400_000,
          currency: "NZD",
        },
      ],
    };

    const result = parseBackup(JSON.stringify(full));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toMatchObject({
      assets: 1,
      liabilities: 1,
      income: 1,
      expenses: 1,
      events: 1,
      kids: 1,
      scenarios: 1,
      history: 1,
      hasSettings: true,
    });
  });
});
