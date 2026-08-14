import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import clsx from "clsx";

import { ProgressRing } from "./ProgressRing";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import {
  useFireTargets,
  usePlanContributions,
  usePortfolioTotals,
  useSavingsSummary,
} from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Stat } from "@/components/ui/Stat";

export function NetWorthHero() {
  const totals = usePortfolioTotals();
  const contributions = usePlanContributions();
  const savings = useSavingsSummary();
  const targets = useFireTargets();
  const currency = useSettings((s) => s.settings.displayCurrency);

  const { netWorth, assetsTotal, liabilitiesTotal, fireNetWorth } = totals;
  const monthlyContributions = contributions.monthlyContributions;
  const annualSavings = monthlyContributions * 12;
  const isPositive = netWorth >= 0;

  return (
    <Card className="overflow-hidden">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-400">
            <Wallet className="h-3 w-3" /> Net Worth · {currency}
          </div>
          <div className="font-mono tabular text-[64px] font-bold leading-none tracking-tighter">
            {formatMoney(netWorth, currency)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-gain" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-loss" />
            )}
            <span className={isPositive ? "text-gain" : "text-loss"}>
              {isPositive ? "Positive net worth" : "In the red"}
            </span>
            {savings.hasIncome && (
              <>
                <span className="text-ink-500">·</span>
                <span className="text-ink-300">
                  {formatPercent(savings.savingsRate, 0)} savings rate
                </span>
              </>
            )}
          </div>

          <div
            className={clsx(
              "mt-8 grid gap-6 border-t border-white/5 pt-6",
              totals.hasExclusions ? "grid-cols-4" : "grid-cols-3",
            )}
          >
            <Stat
              label="Assets"
              tone="gain"
              value={<Money amount={assetsTotal} currency={currency} />}
            />
            <Stat
              label="Liabilities"
              tone={liabilitiesTotal > 0 ? "loss" : "default"}
              value={<Money amount={liabilitiesTotal} currency={currency} />}
            />
            {totals.hasExclusions && (
              <Stat
                hint={`${formatMoney(totals.fireAssetsTotal, currency)} assets − ${formatMoney(totals.fireLiabilitiesTotal, currency)} debt`}
                label="FIRE pot"
                value={<Money amount={fireNetWorth} currency={currency} />}
              />
            )}
            <Stat
              hint={`${formatMoney(annualSavings, currency)} per year`}
              label="Monthly Savings"
              value={
                <Money amount={monthlyContributions} currency={currency} />
              }
            />
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <ProgressRing
            current={Math.max(0, fireNetWorth)}
            target={targets.traditional}
          />
        </div>
      </div>
    </Card>
  );
}
