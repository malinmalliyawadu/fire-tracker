import type { FireType } from "@/types";

import clsx from "clsx";

import { FIRE_TYPE_META, FIRE_TYPES } from "@/domain/labels";
import { progressPercent } from "@/domain/fire";
import { yearsToTarget } from "@/domain/projection";
import { formatMoneyCompact, formatPercent } from "@/domain/format";
import { describeYears } from "@/hooks/useFireSummary";
import { useSettings } from "@/store/settings";
import {
  useAccumulationProjection,
  useFireTargets,
  usePortfolioTotals,
} from "@/store/derived";
import { Progress } from "@/components/ui/Progress";
import { Section } from "@/components/ui/Section";

const EXPLAIN: Record<FireType, string> = {
  lean: "A pared-back retirement, 60% of your spending.",
  traditional: "Your spending as recorded, under the 4% rule.",
  fat: "Room to spare, 150% of your spending.",
  coast: "Enough today that compounding alone gets you there by retirement.",
};

/** Four lines in the sand, in order of distance. */
export function FireLadder() {
  const targets = useFireTargets();
  const totals = usePortfolioTotals();
  const projection = useAccumulationProjection();
  const currency = useSettings((s) => s.settings.displayCurrency);

  const rows = FIRE_TYPES.map((type) => {
    const target = targets[type];
    const pct = progressPercent(totals.fireNetWorth, target);
    const years = yearsToTarget(projection, target);

    return { type, target, pct, years, done: years <= 0 };
  }).sort((a, b) => a.target - b.target);

  return (
    <Section
      lede="Each is a different retirement, on the plan as it stands. The bar is how far your pot has come toward it."
      title="Four versions of done"
    >
      <ol className="divide-y divide-line-soft">
        {rows.map((row) => (
          <li key={row.type} className="py-4">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-medium text-ink">
                  {FIRE_TYPE_META[row.type].label}
                </span>
                {row.done && (
                  <span className="rounded-[5px] bg-flame-wash px-1.5 py-0.5 text-[11px] font-medium text-flame-ink">
                    Reached
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-4">
                <span className="num text-[15px] font-medium text-ink">
                  {formatMoneyCompact(row.target, currency)}
                </span>
                <span
                  className={clsx(
                    "num w-[9.5rem] text-right text-[13.5px]",
                    row.done ? "text-flame-ink" : "text-ink-2",
                  )}
                >
                  {row.done ? "Now" : describeYears(row.years)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-6">
              <p className="min-w-0 text-[13px] leading-snug text-ink-3">
                {EXPLAIN[row.type]}
              </p>
              <div className="flex w-[14rem] shrink-0 items-center gap-3">
                <Progress
                  className="flex-1"
                  tone={row.done ? "flame" : "ink"}
                  value={row.pct / 100}
                />
                <span className="num w-9 text-right text-[12.5px] text-ink-3">
                  {formatPercent(row.pct / 100, 0)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
