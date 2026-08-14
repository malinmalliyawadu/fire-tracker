import { useState } from "react";

import { OnboardingDialog } from "./OnboardingDialog";

import { useExpenses } from "@/store/expenses";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useSettings } from "@/store/settings";

/**
 * Opens the first-run wizard when the app is genuinely empty.
 *
 * Gated on there being no data at all rather than on the `onboarded` flag
 * alone, so an existing user who upgrades never gets interrupted by a setup
 * dialog for a plan they already built.
 */
export function OnboardingGate() {
  const onboarded = useSettings((s) => s.settings.onboarded);
  const assets = usePortfolio((s) => s.assets);
  const liabilities = usePortfolio((s) => s.liabilities);
  const income = useIncome((s) => s.sources);
  const expenses = useExpenses((s) => s.expenses);

  const isEmpty =
    assets.length === 0 &&
    liabilities.length === 0 &&
    income.length === 0 &&
    expenses.length === 0;

  const [open, setOpen] = useState(!onboarded && isEmpty);

  if (onboarded || !isEmpty) return null;

  return <OnboardingDialog isOpen={open} onClose={() => setOpen(false)} />;
}
