import type {
  AssetType,
  ContributionFrequency,
  ExpenseCategory,
  FireType,
  IncomeType,
  LiabilityType,
} from "@/types";
import type { LucideIcon } from "lucide-react";

import {
  Bitcoin,
  Briefcase,
  Building2,
  Car,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Layers,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  User,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  kiwisaver: "KiwiSaver",
  shares: "Shares",
  savings: "Savings",
  crypto: "Crypto",
  property: "Property",
  other: "Other",
};

export const ASSET_TYPES: AssetType[] = [
  "kiwisaver",
  "shares",
  "savings",
  "crypto",
  "property",
  "other",
];

export const LIABILITY_TYPE_LABEL: Record<LiabilityType, string> = {
  mortgage: "Mortgage",
  "student-loan": "Student loan",
  "car-loan": "Car loan",
  "credit-card": "Credit card",
  "personal-loan": "Personal loan",
  other: "Other",
};

export const LIABILITY_TYPES: LiabilityType[] = [
  "mortgage",
  "student-loan",
  "car-loan",
  "credit-card",
  "personal-loan",
  "other",
];

export const FREQUENCY_LABEL: Record<ContributionFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export const FREQUENCY_SHORT: Record<ContributionFrequency, string> = {
  weekly: "/wk",
  fortnightly: "/fn",
  monthly: "/mo",
  quarterly: "/qtr",
  annually: "/yr",
};

export const FREQUENCIES: ContributionFrequency[] = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "annually",
];

export const FIRE_TYPE_META: Record<
  FireType,
  { label: string; description: string }
> = {
  traditional: {
    label: "Traditional",
    description: "25× annual expenses (4% rule)",
  },
  lean: {
    label: "Lean",
    description: "Minimal lifestyle (60%)",
  },
  fat: {
    label: "Fat",
    description: "Comfortable lifestyle (150%)",
  },
  coast: {
    label: "Coast",
    description: "Stop saving, let it grow",
  },
};

export const FIRE_TYPES: FireType[] = ["traditional", "lean", "fat", "coast"];

export const ASSET_TYPE_ICON: Record<AssetType, LucideIcon> = {
  kiwisaver: Building2,
  shares: LineChart,
  savings: PiggyBank,
  crypto: Bitcoin,
  property: Home,
  other: Layers,
};

export const LIABILITY_TYPE_ICON: Record<LiabilityType, LucideIcon> = {
  mortgage: Home,
  "student-loan": GraduationCap,
  "car-loan": Car,
  "credit-card": CreditCard,
  "personal-loan": User,
  other: Landmark,
};

export const FREQUENCY_PILL: Record<ContributionFrequency, string> = {
  weekly: "Wk",
  fortnightly: "Fn",
  monthly: "Mo",
  quarterly: "Qtr",
  annually: "Yr",
};

/**
 * Categorical colours, muted so they sit on paper and ink in either scheme.
 * Semantic colours (gain, loss, flame) are deliberately not in this set.
 */
export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  kiwisaver: "#5b6b8c",
  shares: "#2f7f6e",
  savings: "#8a9a5b",
  crypto: "#c78a2e",
  property: "#a75c4f",
  other: "#8e8b84",
};

export const INCOME_TYPE_LABEL: Record<IncomeType, string> = {
  salary: "Salary",
  "self-employed": "Self-employed",
  rental: "Rental",
  other: "Other",
};

export const INCOME_TYPES: IncomeType[] = [
  "salary",
  "self-employed",
  "rental",
  "other",
];

export const INCOME_TYPE_ICON: Record<IncomeType, LucideIcon> = {
  salary: Briefcase,
  "self-employed": Laptop,
  rental: Home,
  other: Layers,
};

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  housing: "Housing",
  food: "Food",
  transport: "Transport",
  utilities: "Utilities",
  health: "Health",
  insurance: "Insurance",
  discretionary: "Discretionary",
  other: "Other",
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "insurance",
  "discretionary",
  "other",
];

export const EXPENSE_CATEGORY_ICON: Record<ExpenseCategory, LucideIcon> = {
  housing: Home,
  food: UtensilsCrossed,
  transport: Car,
  utilities: Zap,
  health: HeartPulse,
  insurance: ShieldCheck,
  discretionary: Sparkles,
  other: Layers,
};

export const EXPENSE_CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  housing: "#a75c4f",
  food: "#8a9a5b",
  transport: "#5b6b8c",
  utilities: "#c78a2e",
  health: "#b06a8c",
  insurance: "#4f7f8f",
  discretionary: "#7a5ea3",
  other: "#8e8b84",
};
