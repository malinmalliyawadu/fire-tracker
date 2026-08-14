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

export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  kiwisaver: "#7c83e7",
  shares: "#06b6d4",
  savings: "#22c55e",
  crypto: "#f59e0b",
  property: "#ec4899",
  other: "#94a3b8",
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
  housing: "#7c83e7",
  food: "#22c55e",
  transport: "#06b6d4",
  utilities: "#f59e0b",
  health: "#ec4899",
  insurance: "#a855f7",
  discretionary: "#f43f5e",
  other: "#94a3b8",
};
