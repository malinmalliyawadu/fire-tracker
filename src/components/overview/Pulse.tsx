import { useMemo } from "react";

import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
} from "@/domain/format";
import { yearsBetween } from "@/domain/tracking";
import {
  describeSpan,
  describeYears,
  useFireSummary,
} from "@/hooks/useFireSummary";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";
import { usePlanContributions, usePortfolioTotals } from "@/store/derived";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { Money } from "@/components/ui/Money";
import { Progress } from "@/components/ui/Progress";

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

const signed = (amount: number, currency: "NZD" | "USD") =>
  `${amount >= 0 ? "+" : "−"}${formatMoneyCompact(Math.abs(amount), currency)}`;

/**
 * The numbers that move between visits, each against where it stood a month
 * ago. The plan's standing facts live elsewhere; this row is the pulse.
 */
export function Pulse() {
  const summary = useFireSummary();
  const totals = usePortfolioTotals();
  const contributions = usePlanContributions();
  const snapshots = useHistory((s) => s.snapshots);
  const currency = useSettings((s) => s.settings.displayCurrency);

  const since = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const cutoff = Date.now() - WINDOW_DAYS * DAY;
    // The reading closest to a month ago: the newest snapshot at or before
    // the cutoff, or failing that the oldest one since.
    const before = sorted.filter((s) => Date.parse(s.date) <= cutoff);
    const ref =
      before[before.length - 1] ??
      sorted.find((s) => Date.parse(s.date) >= cutoff);

    if (!ref || Date.parse(ref.date) > Date.now() - DAY) return null;

    const elapsedYears = yearsBetween(ref.date, new Date().toISOString());
    const netWorthDelta = totals.netWorth - ref.netWorth;
    const added = contributions.monthlyContributions * elapsedYears * 12;
    const drift =
      ref.yearsToFire !== undefined && Number.isFinite(summary.years)
        ? ref.yearsToFire - elapsedYears - summary.years
        : null;

    return {
      ref,
      elapsedYears,
      netWorthDelta,
      added,
      market: netWorthDelta - added,
      drift,
    };
  }, [
    snapshots,
    totals.netWorth,
    contributions.monthlyContributions,
    summary.years,
  ]);

  const sinceLabel = since
    ? `${Math.round(since.elapsedYears * 365.25)} days`
    : null;

  return (
    <FigureRow cols={4}>
      <Figure
        hint={
          since ? (
            <span
              className={since.netWorthDelta >= 0 ? "text-gain" : "text-loss"}
            >
              {signed(since.netWorthDelta, currency)} in the last {sinceLabel}
            </span>
          ) : (
            "Change shows after a few days of snapshots"
          )
        }
        label="Net worth"
        size="lg"
        value={<Money amount={totals.netWorth} currency={currency} />}
      />
      <Figure
        hint={
          <span className="block">
            <span className="num">
              {formatPercent(summary.progress / 100, 0)}
            </span>{" "}
            of {formatMoneyCompact(summary.target, currency)}
            {!summary.reached && !summary.never && (
              <>, {describeYears(summary.years)} to go</>
            )}
            <Progress
              className="mt-2 max-w-[180px]"
              tone={summary.reached ? "flame" : "ink"}
              value={summary.progress / 100}
            />
          </span>
        }
        label="FIRE pot"
        size="lg"
        value={<Money amount={summary.pot} currency={currency} />}
      />
      <Figure
        hint={
          since?.drift != null
            ? `Against where it stood ${sinceLabel} ago`
            : "Needs a month of snapshots to read"
        }
        label="Your date has moved"
        size="lg"
        tone={
          since?.drift == null
            ? "muted"
            : Math.abs(since.drift) < 2 / 365
              ? "default"
              : since.drift > 0
                ? "gain"
                : "loss"
        }
        value={
          since?.drift == null
            ? "—"
            : Math.abs(since.drift) < 2 / 365
              ? "Holding"
              : `${describeSpan(since.drift)} ${since.drift > 0 ? "earlier" : "later"}`
        }
      />
      <Figure
        hint={
          since
            ? `You added ${formatMoney(Math.max(0, since.added), currency)} over the same ${sinceLabel}`
            : `${formatMoney(contributions.monthlyContributions, currency)} a month goes in`
        }
        label={since ? "The market did" : "Into the pot each month"}
        size="lg"
        tone={since ? (since.market >= 0 ? "gain" : "loss") : "default"}
        value={
          since ? (
            signed(since.market, currency)
          ) : (
            <Money
              amount={contributions.monthlyContributions}
              currency={currency}
            />
          )
        }
      />
    </FigureRow>
  );
}
