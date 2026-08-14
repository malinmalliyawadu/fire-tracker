import { describe, expect, it } from "vitest";

import {
  formatNumericDraft,
  parseAmount,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/domain/number";

describe("sanitizeNumericInput", () => {
  it("strips grouping separators and stray characters", () => {
    expect(sanitizeNumericInput("1,250,000")).toBe("1250000");
    expect(sanitizeNumericInput("NZ$ 1 250 000")).toBe("1250000");
    expect(sanitizeNumericInput("$12,500.75")).toBe("12500.75");
  });

  it("keeps only the first decimal point", () => {
    expect(sanitizeNumericInput("1.2.3")).toBe("1.23");
  });

  it("keeps a trailing point so a decimal can still be typed", () => {
    expect(sanitizeNumericInput("12.")).toBe("12.");
  });

  it("drops the point for whole-number fields", () => {
    expect(sanitizeNumericInput("6.5", { allowDecimal: false })).toBe("65");
  });

  it("drops signs", () => {
    expect(sanitizeNumericInput("-500")).toBe("500");
  });

  it("drops padding zeros but keeps a leading zero before a point", () => {
    expect(sanitizeNumericInput("007")).toBe("7");
    expect(sanitizeNumericInput("0")).toBe("0");
    expect(sanitizeNumericInput("0.")).toBe("0.");
    expect(sanitizeNumericInput("00.5")).toBe("0.5");
  });
});

describe("parseNumericInput", () => {
  it("parses values that contain commas", () => {
    expect(parseNumericInput("1,250,000")).toBe(1250000);
    expect(parseNumericInput("1,250,000.50")).toBe(1250000.5);
  });

  it("returns null when there are no digits", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("   ")).toBeNull();
    expect(parseNumericInput(".")).toBeNull();
    expect(parseNumericInput("abc")).toBeNull();
  });

  it("parses partially typed decimals", () => {
    expect(parseNumericInput("12.")).toBe(12);
    expect(parseNumericInput(".5")).toBe(0.5);
  });
});

describe("parseAmount", () => {
  it("falls back when the input holds no number", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("", 65)).toBe(65);
    expect(parseAmount("1,000")).toBe(1000);
  });
});

describe("formatNumericDraft", () => {
  it("groups the whole part", () => {
    expect(formatNumericDraft("1250000")).toBe("1,250,000");
    expect(formatNumericDraft("999")).toBe("999");
  });

  it("leaves the decimal part exactly as typed", () => {
    expect(formatNumericDraft("1250000.5")).toBe("1,250,000.5");
    expect(formatNumericDraft("1250.")).toBe("1,250.");
  });

  it("preserves leading zeros while typing", () => {
    expect(formatNumericDraft("007")).toBe("007");
  });

  it("passes an empty draft through", () => {
    expect(formatNumericDraft("")).toBe("");
  });
});
