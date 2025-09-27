export type AssetType =
  | "individual-stock"
  | "kiwisaver"
  | "savings-account"
  | "term-deposit"
  | "bitcoin"
  | "ethereum"
  | "other";
export type AccountType =
  | "kiwisaver"
  | "investment"
  | "savings"
  | "term-deposit"
  | "shares"
  | "managed-funds"
  | "property"
  | "other";
export type LiabilityType =
  | "mortgage"
  | "car-loan"
  | "student-loan"
  | "credit-card"
  | "personal-loan"
  | "hire-purchase"
  | "overdraft"
  | "other";

export type ContributionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "annually";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  accountType: AccountType;
  value: number;
  contributions: number;
  contributionFrequency: ContributionFrequency;
  dateAdded: string;
  lastUpdated: string;
  notes?: string;
  // Specific fields for different asset types
  stockSymbol?: string; // For individual stocks (e.g., "AAPL", "TSLA")
  stockCurrency?: "NZD" | "USD"; // Currency for stock values
  quantity?: number; // Quantity for crypto only (BTC/ETH amounts)
  interestRate?: number; // For savings accounts and term deposits
  maturityDate?: string; // For term deposits
  kiwiSaverProvider?: string; // For KiwiSaver (e.g., "ANZ", "ASB", "Simplicity")
  kiwiSaverFund?: string; // Specific fund name
  cryptoAddress?: string; // For crypto tracking (optional)
  autoUpdate?: boolean; // Whether to fetch live prices
}

export interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice?: number;
  lastUpdated?: string;
}

export interface KiwiSaverComposition {
  provider: string;
  fundName: string;
  holdings: StockHolding[];
  cashPercentage: number;
  bondsPercentage: number;
  internationalEquitiesPercentage: number;
  domesticEquitiesPercentage: number;
}

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  paymentFrequency: ContributionFrequency;
  dateAdded: string;
  lastUpdated: string;
  notes?: string;
}

export interface Settings {
  fireTarget: number;
  withdrawalRate: number;
  expectedReturn: number;
  inflationRate: number;
  retirementAge: number;
  currentAge: number;
  currency: string;
}

export interface NetWorthHistory {
  id: string;
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface Milestone {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
  achieved: boolean;
  achievedDate?: string;
  description?: string;
}

export interface AppData {
  assets: Asset[];
  liabilities: Liability[];
  settings: Settings;
  history: NetWorthHistory[];
  milestones: Milestone[];
}

export interface FIRECalculation {
  fireNumber: number;
  currentNetWorth: number;
  yearsToFIRE: number;
  monthlyContributionNeeded: number;
  progressPercentage: number;
  coastFIRENumber: number;
  leanFIRENumber: number;
  fatFIRENumber: number;
}

export interface ProjectionPoint {
  year: number;
  age: number;
  value: number;
  contributions: number;
  growth: number;
}
