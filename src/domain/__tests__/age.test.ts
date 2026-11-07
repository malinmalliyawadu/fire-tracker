import type { StoredSettings } from "@/types";

import { describe, expect, it } from "vitest";

import {
  ageOn,
  birthDateForAge,
  isIsoDate,
  mergeSettings,
  resolveBirthDate,
  withAges,
} from "../age";

const stored: StoredSettings = {
  displayCurrency: "NZD",
  birthDate: "1990-06-15",
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
  household: {
    hasPartner: true,
    partnerBirthDate: "1992-03-01",
    includePartnerNzSuper: true,
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

describe("ageOn", () => {
  it("counts whole years, turning over on the birthday itself", () => {
    expect(ageOn("1990-06-15", new Date(2026, 5, 14))).toBe(35);
    expect(ageOn("1990-06-15", new Date(2026, 5, 15))).toBe(36);
    expect(ageOn("1990-06-15", new Date(2026, 5, 16))).toBe(36);
  });

  it("never goes below zero", () => {
    expect(ageOn("2030-01-01", new Date(2026, 0, 1))).toBe(0);
  });
});

describe("birthDateForAge", () => {
  it("places the birthday on the given day, so the age holds for a year", () => {
    const on = new Date(2026, 10, 7);
    const birthDate = birthDateForAge(36, on);

    expect(birthDate).toBe("1990-11-07");
    expect(ageOn(birthDate, on)).toBe(36);
    expect(ageOn(birthDate, new Date(2027, 10, 6))).toBe(36);
    expect(ageOn(birthDate, new Date(2027, 10, 7))).toBe(37);
  });
});

describe("isIsoDate", () => {
  it("accepts a calendar date and nothing looser", () => {
    expect(isIsoDate("1990-06-15")).toBe(true);
    expect(isIsoDate("1990-6-15")).toBe(false);
    expect(isIsoDate("1990-13-01")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(1990)).toBe(false);
    expect(isIsoDate("1990-06-15T00:00:00Z")).toBe(false);
  });
});

describe("resolveBirthDate", () => {
  it("prefers a date, then an age, then the fallback", () => {
    expect(resolveBirthDate("1990-06-15", 40, "2000-01-01")).toBe("1990-06-15");
    expect(resolveBirthDate(undefined, 40, "2000-01-01")).toBe(
      birthDateForAge(40),
    );
    expect(resolveBirthDate("not a date", undefined, "2000-01-01")).toBe(
      "2000-01-01",
    );
  });
});

describe("withAges", () => {
  it("fills in both ages as of the given day", () => {
    const settings = withAges(stored, new Date(2026, 10, 7));

    expect(settings.currentAge).toBe(36);
    expect(settings.household.partnerAge).toBe(34);
    expect(settings.birthDate).toBe("1990-06-15");
  });
});

describe("mergeSettings", () => {
  it("turns the ages an older version kept into birth dates", () => {
    const merged = mergeSettings(stored, {
      currentAge: 41,
      household: { hasPartner: false, partnerAge: 39 } as never,
    });

    expect(merged.birthDate).toBe(birthDateForAge(41));
    expect(merged.household.partnerBirthDate).toBe(birthDateForAge(39));
    expect(merged.household.hasPartner).toBe(false);
    expect(merged.household.includePartnerNzSuper).toBe(true);
    expect(merged).not.toHaveProperty("currentAge");
    expect(merged.household).not.toHaveProperty("partnerAge");
  });

  it("lets a date win over an age sent alongside it", () => {
    const merged = mergeSettings(stored, {
      birthDate: "1985-02-02",
      currentAge: 20,
    });

    expect(merged.birthDate).toBe("1985-02-02");
  });

  it("keeps the dates it has when a patch says nothing about them", () => {
    const merged = mergeSettings(stored, { retirementAge: 60 });

    expect(merged.birthDate).toBe("1990-06-15");
    expect(merged.household.partnerBirthDate).toBe("1992-03-01");
    expect(merged.retirementAge).toBe(60);
  });

  it("ignores a malformed date rather than storing it", () => {
    const merged = mergeSettings(stored, { birthDate: "" });

    expect(merged.birthDate).toBe("1990-06-15");
  });
});
