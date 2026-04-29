import type { FireType } from "@/types";

import clsx from "clsx";

import { FIRE_TYPE_META, FIRE_TYPES } from "@/domain/labels";
import { progressPercent, yearsToFire } from "@/domain/fire";
import { formatMoneyCompact, formatYears } from "@/domain/format";
import { useSettings } from "@/store/settings";
import {
  useFireTargets,
  usePortfolioTotals,
} from "@/store/derived";

const ACCENT_FOR: Record<FireType, string> = {
  traditional: "from-accent/40 to-accent/0",
  lean: "from-emerald-500/30 to-emerald-500/0",
  fat: "from-amber-500/30 to-amber-500/0",
  coast: "from-cyan-500/30 to-cyan-500/0",
};

const STROKE_FOR: Record<FireType, string> = {
  traditional: "bg-accent",
  lean: "bg-emerald-500",
  fat: "bg-amber-500",
  coast: "bg-cyan-500",
};

export function FireTypeCards() {
  const targets = useFireTargets();
  const totals = usePortfolioTotals();
  const settings = useSettings((s) => s.settings);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FIRE_TYPES.map((type) => {
        const target = targets[type];
        const pct = progressPercent(totals.netWorth, target);
        const years = yearsToFire({
          netWorth: totals.netWorth,
          monthlyContribution: totals.monthlyContributions,
          target,
          expectedReturn: settings.expectedReturn,
        });

        return (
          <div
            key={type}
            className={clsx(
              "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900/50 p-5 shadow-card backdrop-blur-xl transition-colors hover:border-white/10",
            )}
          >
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-80",
                ACCENT_FOR[type],
              )}
            />
            <div className="relative">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {FIRE_TYPE_META[type].label} FIRE
              </div>
              <div className="mt-1 font-mono tabular text-2xl font-semibold tracking-tight">
                {formatMoneyCompact(target, settings.displayCurrency)}
              </div>
              <p className="mt-1 text-[11px] text-ink-400">
                {FIRE_TYPE_META[type].description}
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-300">{pct.toFixed(0)}%</span>
                  <span className="font-mono tabular text-ink-300">
                    {formatYears(years)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      STROKE_FOR[type],
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
