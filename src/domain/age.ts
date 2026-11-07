import type { Household, Settings, StoredSettings } from "@/types";

import {
  differenceInYears,
  format,
  isValid,
  parseISO,
  subYears,
} from "date-fns";

/** A calendar date written YYYY-MM-DD. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && ISO_DATE.test(value) && isValid(parseISO(value));

/** Today as YYYY-MM-DD, in local time. */
export const todayIso = (): string => format(new Date(), "yyyy-MM-dd");

/** Whole years lived by `on`, counting the birthday itself. */
export const ageOn = (birthDate: string, on: Date = new Date()): number =>
  Math.max(0, differenceInYears(on, parseISO(birthDate)));

/**
 * A birth date for someone who is `age` on `on`. Their birthday is taken to
 * be that day, so the age they gave holds for a full year before it moves.
 */
export const birthDateForAge = (age: number, on: Date = new Date()): string =>
  format(subYears(on, Math.max(0, Math.round(age))), "yyyy-MM-dd");

/**
 * The birth date to keep when settings may carry a date, an age, or neither:
 * a well-formed date wins, an age alone is read as a birthday today, and
 * otherwise `fallback` stands.
 */
export const resolveBirthDate = (
  birthDate: unknown,
  age: unknown,
  fallback: string,
): string => {
  if (isIsoDate(birthDate)) return birthDate;
  if (typeof age === "number" && Number.isFinite(age)) {
    return birthDateForAge(age);
  }

  return fallback;
};

/** The stored settings with today's ages read off the birth dates. */
export const withAges = (
  stored: StoredSettings,
  on: Date = new Date(),
): Settings => ({
  ...stored,
  currentAge: ageOn(stored.birthDate, on),
  household: {
    ...stored.household,
    partnerAge: ageOn(stored.household.partnerBirthDate, on),
  },
});

/**
 * Fold a patch into the stored settings.
 *
 * A patch can come from a form, from storage written by an older version, or
 * from a backup, so it may carry ages where dates are now kept. An age with
 * no date becomes the date of someone who turned that age today; the ages
 * themselves are never stored, since they are read off the dates.
 */
export const mergeSettings = (
  base: StoredSettings,
  patch: Partial<Settings>,
): StoredSettings => {
  const { currentAge, household: patchHousehold, ...rest } = patch;
  const { partnerAge, ...householdRest } = (patchHousehold ??
    {}) as Partial<Household>;

  return {
    ...base,
    ...rest,
    birthDate: resolveBirthDate(patch.birthDate, currentAge, base.birthDate),
    household: {
      ...base.household,
      ...householdRest,
      partnerBirthDate: resolveBirthDate(
        patchHousehold?.partnerBirthDate,
        partnerAge,
        base.household.partnerBirthDate,
      ),
    },
  };
};
