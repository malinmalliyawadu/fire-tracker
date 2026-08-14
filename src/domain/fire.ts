import type { FireTargets, FireType } from "@/types";

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
