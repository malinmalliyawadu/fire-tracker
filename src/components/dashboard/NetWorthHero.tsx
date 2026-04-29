import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useFireTargets, usePortfolioTotals } from "@/store/derived";

import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Stat } from "@/components/ui/Stat";
import { ProgressRing } from "./ProgressRing";

export function NetWorthHero() {
  const totals = usePortfolioTotals();
  const targets = useFireTargets();
  const currency = useSettings((s) => s.settings.displayCurrency);

  const { netWorth, assetsTotal, liabilitiesTotal, monthlyContributions } =
    totals;
  const annualSavings = monthlyContributions * 12;
  const savingsRate =
    annualSavings > 0 ? annualSavings / (annualSavings + 50_000) : 0;
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
            <span className="text-ink-500">·</span>
            <span className="text-ink-300">
              {formatPercent(savingsRate, 0)} savings rate
            </span>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/5 pt-6">
            <Stat
              label="Assets"
              value={<Money amount={assetsTotal} currency={currency} />}
              tone="gain"
            />
            <Stat
              label="Liabilities"
              value={<Money amount={liabilitiesTotal} currency={currency} />}
              tone={liabilitiesTotal > 0 ? "loss" : "default"}
            />
            <Stat
              label="Monthly Savings"
              value={
                <Money
                  amount={monthlyContributions}
                  currency={currency}
                />
              }
              hint={`${formatMoney(annualSavings, currency)} per year`}
            />
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <ProgressRing
            current={Math.max(0, netWorth)}
            target={targets.traditional}
          />
        </div>
      </div>
    </Card>
  );
}
