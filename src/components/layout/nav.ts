import type { LucideIcon } from "lucide-react";

import {
  ArrowLeftRight,
  Compass,
  Landmark,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Six places, in the order a plan is read: where you are, what you own, how
 * it has done, what flows in and out, what could change, and the assumptions
 * beneath.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: Compass },
  { to: "/portfolio", label: "Portfolio", icon: Landmark },
  { to: "/performance", label: "Performance", icon: TrendingUp },
  { to: "/cashflow", label: "Cash flow", icon: ArrowLeftRight },
  { to: "/simulate", label: "Simulate", icon: SlidersHorizontal },
  { to: "/settings", label: "Settings", icon: Settings2 },
];
