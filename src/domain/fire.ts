import type { Asset, FireTargets, FireType, Liability } from "@/types";

/**
 * Whether a holding or debt belongs to the pot that funds retirement.
 *
 * The flag is opt-out rather than opt-in: anything recorded before the flag
 * existed, and anything added without a deliberate choice, counts. Only an
 * explicit `false` takes something out of the FIRE picture.
 */
export const countsTowardFire = (item: {
  countsTowardFire?: boolean;
}): boolean => item.countsTowardFire !== false;

/**
 * Mortgages still counted toward FIRE while some property sits outside it.
 *
 * These are the loans whose balance is subtracted from the retirement pot
 * without the asset behind them being in it — the asymmetry that makes the pot
 * read far smaller than the investments actually backing it.
 *
 * Assets and loans aren't linked in the data model, so this can't know *which*
 * property secures which mortgage. It deliberately errs toward flagging: with
 * a property excluded, a counted mortgage is worth a second look either way.
 * Returns empty when every property counts, since then the netting is honest.
 */
export const unpairedPropertyMortgages = (
  assets: Asset[],
  liabilities: Liability[],
): Liability[] => {
  const hasExcludedProperty = assets.some(
    (a) => a.type === "property" && !countsTowardFire(a),
  );

  if (!hasExcludedProperty) return [];

  return liabilities.filter(
    (l) => l.type === "mortgage" && countsTowardFire(l),
  );
};

export interface FireInputs {
  annualExpenses: number;
  withdrawalRate: number;
  expectedReturn: number;
  inflationRate: number;
  currentAge: number;
  retirementAge: number;
}

export const computeFireTargets = (inputs: FireInputs): FireTargets => {
  const traditional = inputs.annualExpenses / inputs.withdrawalRate;
  const realReturn = inputs.expectedReturn - inputs.inflationRate;
  const yearsToRetirement = Math.max(
    0,
    inputs.retirementAge - inputs.currentAge,
  );
  const coastDivisor = Math.pow(1 + realReturn, yearsToRetirement);

  return {
    traditional,
    lean: traditional * 0.6,
    fat: traditional * 1.5,
    coast: coastDivisor > 0 ? traditional / coastDivisor : traditional,
  };
};

export const fireTargetFor = (type: FireType, targets: FireTargets): number => {
  return targets[type];
};

export const progressPercent = (netWorth: number, target: number): number => {
  if (target <= 0) return netWorth >= 0 ? 100 : 0;
  if (netWorth <= 0) return 0;

  return Math.min(100, (netWorth / target) * 100);
};
