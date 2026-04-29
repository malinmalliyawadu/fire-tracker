export type Currency = "NZD" | "USD";

export type ContributionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "annually";

export type AssetType =
  | "kiwisaver"
  | "shares"
  | "savings"
  | "crypto"
  | "property"
  | "other";

export type LiabilityType =
  | "mortgage"
  | "student-loan"
  | "car-loan"
  | "credit-card"
  | "personal-loan"
  | "other";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  currency: Currency;
  contribution: number;
  frequency: ContributionFrequency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  balance: number;
  currency: Currency;
  interestRate: number;
  payment: number;
  frequency: ContributionFrequency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  displayCurrency: Currency;
  currentAge: number;
  retirementAge: number;
  annualExpenses: number;
  withdrawalRate: number;
  expectedReturn: number;
  inflationRate: number;
  nzSuperAnnual: number;
  nzSuperStartAge: number;
  kiwisaverUnlockAge: number;
  usdToNzd: number;
  exchangeRateUpdatedAt?: string;
}

export type FireType = "traditional" | "lean" | "fat" | "coast";

export interface SimulationInputs {
  monthlySavings: number;
  expectedReturn: number;
  withdrawalRate: number;
  retirementAge: number;
  fireType: FireType;
  includeNzSuper: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  color: string;
  inputs: SimulationInputs;
  createdAt: string;
}

export interface ProjectionPoint {
  year: number;
  age: number;
  netWorth: number;
  accessible: number;
  locked: number;
  contributed: number;
  withdrawn: number;
}

export interface FireTargets {
  traditional: number;
  lean: number;
  fat: number;
  coast: number;
}
