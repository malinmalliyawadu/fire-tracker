import type {
  AssetType,
  ContributionFrequency,
  FireType,
  LiabilityType,
} from "@/types";
import type { LucideIcon } from "lucide-react";

import {
  Bitcoin,
  Building2,
  Car,
  CreditCard,
  GraduationCap,
  Home,
  Landmark,
  Layers,
  LineChart,
  PiggyBank,
  User,
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
