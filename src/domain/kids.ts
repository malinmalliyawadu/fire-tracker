import type { Kid } from "@/types";

/**
 * Indicative annual cost of one dependent child, in NZD, by the child's age.
 *
 * A flat per-year figure hides the shape that actually matters for planning:
 * childcare dominates the pre-school years, the middle years are cheaper, and
 * costs climb again through secondary school and any tertiary support.
 * Bands are inclusive of the lower bound and exclusive of `untilAge`.
 */
export const KID_COST_BANDS: ReadonlyArray<{
  untilAge: number;
  annualNzd: number;
  label: string;
}> = [
  { untilAge: 5, annualNzd: 18_000, label: "Childcare years" },
  { untilAge: 13, annualNzd: 12_000, label: "Primary school" },
  { untilAge: 18, annualNzd: 15_000, label: "Secondary school" },
  { untilAge: 22, annualNzd: 20_000, label: "Tertiary support" },
];

/** The age at which a child stops costing anything in this model. */
export const KID_INDEPENDENT_AGE =
  KID_COST_BANDS[KID_COST_BANDS.length - 1].untilAge;

/** Annual cost in NZD for a child of the given age. Zero once independent. */
export const kidCostAtAge = (age: number): number => {
  if (age < 0) return 0;

  for (const band of KID_COST_BANDS) {
    if (age < band.untilAge) return band.annualNzd;
  }

  return 0;
};

export interface KidsCostInputs {
  kids: Kid[];
  /** Calendar year the projection starts from. */
  startYear: number;
  /** How many years the projection runs. */
  years: number;
}

/**
 * Total annual kid costs in NZD for each year of a projection, indexed by year
 * offset. A child born in a future year contributes nothing until they arrive,
 * and drops out once independent.
 */
export const kidsCostByYear = ({
  kids,
  startYear,
  years,
}: KidsCostInputs): number[] => {
  const costs: number[] = [];

  for (let year = 0; year <= years; year++) {
    const calendarYear = startYear + year;
    let total = 0;

    for (const kid of kids) {
      total += kidCostAtAge(calendarYear - kid.birthYear);
    }

    costs.push(total);
  }

  return costs;
};

/**
 * Cost profile for hypothetical kids born in `startYear`, used by the
 * simulator's "plan with kids" toggle when no real children are recorded.
 */
export const hypotheticalKidsCostByYear = (
  count: number,
  years: number,
): number[] => {
  const costs: number[] = [];

  for (let year = 0; year <= years; year++) {
    costs.push(kidCostAtAge(year) * Math.max(0, count));
  }

  return costs;
};
