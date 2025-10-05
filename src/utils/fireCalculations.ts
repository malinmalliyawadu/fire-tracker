import type { Settings, FIRECalculation, ProjectionPoint, ContributionFrequency } from "../types/fire";

export const calculateFIRENumber = (settings: Settings): number => {
  return settings.fireTarget;
};

export const calculateLeanFIRE = (settings: Settings): number => {
  return settings.fireTarget * 0.6;
};

export const calculateFatFIRE = (settings: Settings): number => {
  return settings.fireTarget * 1.5;
};

export const calculateCoastFIRE = (settings: Settings): number => {
  const yearsToRetirement = settings.retirementAge - settings.currentAge;
  const realReturn = settings.expectedReturn - settings.inflationRate;

  return settings.fireTarget / Math.pow(1 + realReturn, yearsToRetirement);
};

export const calculateYearsToFIRE = (
  currentNetWorth: number,
  monthlyContribution: number,
  fireTarget: number,
  expectedReturn: number,
  currentAge: number,
  retirementAge: number,
): number => {
  if (currentNetWorth >= fireTarget) return 0;

  const monthlyReturn = expectedReturn / 12;
  const targetAmount = fireTarget - currentNetWorth;

  if (monthlyContribution <= 0) return Infinity;

  const months =
    Math.log((targetAmount * monthlyReturn) / monthlyContribution + 1) /
    Math.log(1 + monthlyReturn);

  const financialYearsToFIRE = Math.max(0, months / 12);
  const yearsToRetirement = retirementAge - currentAge;

  // Return the minimum of financial FIRE timeline and years until retirement age
  return Math.min(financialYearsToFIRE, yearsToRetirement);
};

export const calculateMonthlyContributionNeeded = (
  currentNetWorth: number,
  fireTarget: number,
  yearsToFIRE: number,
  expectedReturn: number,
): number => {
  if (yearsToFIRE <= 0) return 0;
  if (currentNetWorth >= fireTarget) return 0;

  const monthlyReturn = expectedReturn / 12;
  const months = yearsToFIRE * 12;
  const futureValueOfCurrent =
    currentNetWorth * Math.pow(1 + monthlyReturn, months);
  const remainingAmount = fireTarget - futureValueOfCurrent;

  if (remainingAmount <= 0) return 0;

  const annuityFactor =
    (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;

  return remainingAmount / annuityFactor;
};

export const calculateProgressPercentage = (
  currentNetWorth: number,
  fireTarget: number,
  startingNetWorth: number = 0,
): number => {
  // Debug logging for break even milestone
  if (fireTarget === 0) {
    console.log('Break Even Progress Debug:', {
      currentNetWorth,
      fireTarget,
      startingNetWorth,
      progressAmount: currentNetWorth - startingNetWorth,
      targetAmount: fireTarget - startingNetWorth
    });
  }

  // Special case: if target is 0 (break even) and current is negative
  if (fireTarget === 0 && currentNetWorth < 0) {
    // For break even milestone, we want to show progress from starting debt to $0
    if (startingNetWorth < 0) {
      // Started with debt, progressing toward $0
      const progressAmount = currentNetWorth - startingNetWorth;
      const targetAmount = 0 - startingNetWorth;
      const result = Math.min(100, Math.max(0, (progressAmount / targetAmount) * 100));
      console.log('Break even calculation result:', result);
      return result;
    } else {
      // Started positive but now negative (unusual case)
      return 0;
    }
  }

  // Special case: target is reached or exceeded
  if (currentNetWorth >= fireTarget) return 100;

  const progressAmount = currentNetWorth - startingNetWorth;
  const targetAmount = fireTarget - startingNetWorth;

  if (targetAmount <= 0) return 100;

  return Math.min(100, Math.max(0, (progressAmount / targetAmount) * 100));
};

export const calculateFIREMetrics = (
  currentNetWorth: number,
  monthlyContribution: number,
  settings: Settings,
  history?: Array<{ netWorth: number; date: string }>,
): FIRECalculation => {
  const fireNumber = calculateFIRENumber(settings);
  const leanFIRENumber = calculateLeanFIRE(settings);
  const fatFIRENumber = calculateFatFIRE(settings);
  const coastFIRENumber = calculateCoastFIRE(settings);

  const yearsToFIRE = calculateYearsToFIRE(
    currentNetWorth,
    monthlyContribution,
    fireNumber,
    settings.expectedReturn,
    settings.currentAge,
    settings.retirementAge,
  );

  const monthlyContributionNeeded = calculateMonthlyContributionNeeded(
    currentNetWorth,
    fireNumber,
    yearsToFIRE,
    settings.expectedReturn,
  );

  // Get starting net worth from first snapshot if available
  const startingNetWorth = history && history.length > 0
    ? history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].netWorth
    : 0;

  const progressPercentage = calculateProgressPercentage(
    currentNetWorth,
    fireNumber,
    startingNetWorth,
  );

  return {
    fireNumber,
    currentNetWorth,
    yearsToFIRE,
    monthlyContributionNeeded,
    progressPercentage,
    coastFIRENumber,
    leanFIRENumber,
    fatFIRENumber,
  };
};

export const generateProjection = (
  currentNetWorth: number,
  monthlyContribution: number,
  expectedReturn: number,
  currentAge: number,
  years: number = 40,
  retirementAge?: number,
  withdrawalRate?: number,
  isDebtOnly: boolean = false,
  investmentReturn?: number,
): ProjectionPoint[] => {
  const points: ProjectionPoint[] = [];
  let value = currentNetWorth;
  let totalContributions = 0;
  const savingsReturn = investmentReturn ?? expectedReturn;

  for (let year = 0; year <= years; year++) {
    const age = currentAge + year;
    const isRetired = retirementAge && age >= retirementAge;

    points.push({
      year,
      age,
      value: Math.round(value),
      contributions: Math.round(totalContributions),
      growth: Math.round(value - totalContributions - currentNetWorth),
    });

    if (year < years) {
      if (isRetired) {
        // Retirement phase: no more contributions, optional withdrawals
        if (value > 0) {
          // Only withdraw if we have positive net worth
          const annualWithdrawal = withdrawalRate ? value * withdrawalRate : 0;
          const beforeValue = value;
          value = (value - annualWithdrawal) * (1 + savingsReturn);

          // Debug logging for retirement calculations
          if (year === Math.ceil(retirementAge - currentAge) + 1) {
            console.log('Retirement calculations:', {
              age,
              beforeValue,
              withdrawalRate,
              annualWithdrawal,
              savingsReturn,
              afterValue: value,
              netChange: value - beforeValue
            });
          }
        }
        // If still in debt at retirement, debt continues but no more payments
        else if (value < 0) {
          // Debt continues to accumulate interest but no payments
          const debtInterest = value * expectedReturn;
          value = value + debtInterest;
        }
      } else {
        // Accumulation phase: contribute and grow
        const yearlyContribution = monthlyContribution * 12;
        totalContributions += yearlyContribution;

        // If net worth is negative (more liabilities than assets)
        if (value < 0) {
          // Debt reduction: payments reduce the negative value (debt)
          // Interest increases the debt (makes it more negative)
          const debtInterest = value * expectedReturn; // Negative value * positive rate = negative (increases debt)
          const newValue = value + yearlyContribution + debtInterest;

          if (newValue >= 0) {
            // Debt is paid off this year
            // Calculate the portion of the year it took to pay off
            // const debtPaidOffAmount = -value; // Amount needed to reach zero
            // const interestOnDebt = value * expectedReturn;
            // const principalPayment = yearlyContribution + interestOnDebt;

            if (isDebtOnly) {
              // For debt-only scenarios, once paid off, continue saving/investing
              // The excess payment becomes savings that grows at investment rate
              value = newValue * (1 + savingsReturn);
            } else {
              value = newValue;
            }
          } else {
            value = newValue;
          }
        } else {
          // Positive net worth: normal accumulation with growth
          // Use savingsReturn for investment growth when debt is paid off
          value = (value + yearlyContribution) * (1 + savingsReturn);
        }
      }
    }
  }

  return points;
};

export const formatCurrency = (
  amount: number,
  currency: string = "NZD",
): string => {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (
  value: number,
  decimals: number = 1,
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-NZ").format(value);
};

export const convertToMonthlyContribution = (
  amount: number,
  frequency: ContributionFrequency
): number => {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12; // 52 weeks / 12 months
    case "fortnightly":
      return (amount * 26) / 12; // 26 fortnights / 12 months
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3; // Quarterly to monthly
    case "annually":
      return amount / 12; // Annual to monthly
    default:
      return amount;
  }
};

export const getFrequencyLabel = (frequency: ContributionFrequency): string => {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "fortnightly":
      return "Fortnightly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "annually":
      return "Annually";
    default:
      return "Monthly";
  }
};
