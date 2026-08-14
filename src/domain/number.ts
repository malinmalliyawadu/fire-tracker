/**
 * Helpers for numeric text entry.
 *
 * Users type (and paste) amounts as "1,250,000" or "1 250 000". Everything that
 * reads a typed value goes through here so grouping separators, currency
 * symbols and stray characters never reach parseFloat.
 *
 * These fields are all non-negative amounts, ages and rates, so a leading "-"
 * is treated as noise and dropped.
 */

interface SanitizeOptions {
  allowDecimal?: boolean;
}

/** Drop zeros that only pad the whole part: "007" -> "7", but "0.5" is kept. */
const trimLeadingZeros = (digits: string): string =>
  digits.replace(/^0+(?=\d)/, "");

/** Reduce typed text to a bare numeric string: digits plus at most one point. */
export const sanitizeNumericInput = (
  raw: string,
  { allowDecimal = true }: SanitizeOptions = {},
): string => {
  const digits = raw.replace(/[^\d.]/g, "");

  if (!allowDecimal) return trimLeadingZeros(digits.replace(/\./g, ""));

  const point = digits.indexOf(".");

  if (point === -1) return trimLeadingZeros(digits);

  return (
    trimLeadingZeros(digits.slice(0, point + 1)) +
    digits.slice(point + 1).replace(/\./g, "")
  );
};

/** Parse typed text to a number, or null when it holds no usable digits. */
export const parseNumericInput = (raw: string): number | null => {
  const cleaned = sanitizeNumericInput(raw);

  if (!cleaned || cleaned === ".") return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
};

/** Parse typed text to a number, falling back when it holds no usable digits. */
export const parseAmount = (raw: string, fallback = 0): number =>
  parseNumericInput(raw) ?? fallback;

/**
 * Add thousands separators to a sanitized draft, preserving it exactly as
 * typed otherwise — including a trailing point and any leading zeros.
 */
export const formatNumericDraft = (draft: string): string => {
  if (!draft) return "";

  const point = draft.indexOf(".");
  const whole = point === -1 ? draft : draft.slice(0, point);
  const rest = point === -1 ? "" : draft.slice(point);

  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + rest;
};
