import { LineChart } from "lucide-react";
import { Link } from "react-router-dom";

import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
} from "@/domain/format";
import { describeSpan } from "@/hooks/useFireSummary";
import { useSettings } from "@/store/settings";
import { usePlanTracking } from "@/store/derived";
import { EmptyState } from "@/components/ui/EmptyState";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { Section } from "@/components/ui/Section";

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

/** Percentage points, to one place: "0.9 points", "1 point". */
const describePoints = (fraction: number): string => {
  const points = (Math.abs(fraction) * 100).toFixed(1);

  return `${points} point${points === "1.0" ? "" : "s"}`;
};

/** How the recorded snapshots compare with what the plan expected. */
export function Tracking() {
  const { comparison, attribution, returns } = usePlanTracking();
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;

  if (!comparison && !attribution) {
    return (
      <Section title="Actual against plan">
        <EmptyState
          description="Once two snapshots sit at least a month apart, this compares where you are with where the plan said you would be, shows the return your pot has actually earned against the one you assume, and splits the growth into what you put in and what the market did."
          icon={LineChart}
          title="Not enough history yet"
        />
      </Section>
    );
  }

  const ahead = (comparison?.delta ?? 0) >= 0;

  // Observed values are after tax, so the honest yardstick is the after-tax
  // version of the assumption. Within half a point is a match, not a verdict.
  const taxed =
    settings.applyInvestmentTax &&
    returns !== null &&
    Math.abs(returns.expected - returns.expectedAfterTax) >= 0.0005;
  const returnGap = returns
    ? returns.estimate.annualised - returns.expectedAfterTax
    : 0;
  const returnTone =
    Math.abs(returnGap) < 0.005 ? "default" : returnGap > 0 ? "gain" : "loss";

  return (
    <Section title="Actual against plan">
      <div className="space-y-6">
        {comparison && (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <Figure
              hint={`${formatPercent(Math.abs(comparison.deltaPercent), 1)} ${ahead ? "above" : "below"} the projection anchored at your first snapshot`}
              label={ahead ? "Ahead of plan" : "Behind plan"}
              size="lg"
              tone={ahead ? "gain" : "loss"}
              value={`${ahead ? "+" : "−"}${formatMoney(Math.abs(comparison.delta), currency)}`}
            />
            <div className="num text-[13px] leading-relaxed text-ink-3 sm:text-right">
              <div>
                Plan expected {formatMoney(comparison.expected, currency)}
              </div>
              <div>You have {formatMoney(comparison.actual, currency)}</div>
              <div>over {describeSpan(comparison.yearsTracked)} of record</div>
            </div>
          </div>
        )}

        {returns && (
          <div className="rule pt-6">
            <h3 className="mb-4 text-[14px] font-medium text-ink">
              What your money has earned
            </h3>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <Figure
                hint={
                  returnTone === "default"
                    ? `In line with the ${formatPercent(returns.expectedAfterTax, 1)} the plan assumes${taxed ? " after tax" : ""}`
                    : `${describePoints(returnGap)} ${returnGap > 0 ? "above" : "below"} the ${formatPercent(returns.expectedAfterTax, 1)} the plan assumes${taxed ? " after tax" : ""}`
                }
                label="Actual return on your pot"
                size="lg"
                tone={returnTone}
                value={`${formatPercent(returns.estimate.annualised, 1)} a year`}
              />
              <div className="num text-[13px] leading-relaxed text-ink-3 sm:text-right">
                <div>
                  Plan assumes {formatPercent(returns.expected, 1)}
                  {taxed && (
                    <>
                      , {formatPercent(returns.expectedAfterTax, 1)} after tax
                    </>
                  )}
                </div>
                <div>
                  {returns.estimate.gain >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(returns.estimate.gain), currency)}{" "}
                  earned beyond what you put in
                </div>
                <div>
                  over {describeSpan(returns.estimate.yearsTracked)}, from{" "}
                  {formatMoneyCompact(returns.estimate.startValue, currency)}{" "}
                  invested
                </div>
              </div>
            </div>
            <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">
              The annual rate at which what you started with, plus each
              contribution from the month it went in, grew into what the
              pot&apos;s assets are worth now.
              {returns.estimate.yearsTracked < 1 &&
                " Under a year of record, this moves with a few weeks of markets; it settles as the record grows."}{" "}
              A holding you add or revalue by hand counts as a return here, so a
              jump after an edit is the edit, not the market.
            </p>
            <Link
              className="mt-3 inline-block text-[13px] text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
              to="/performance"
            >
              See how this compares with the S&amp;P 500
            </Link>
          </div>
        )}

        {attribution && (
          <div className="rule pt-6">
            <h3 className="mb-4 text-[14px] font-medium text-ink">
              Where the growth came from
            </h3>
            <FigureRow cols={3}>
              <Figure
                label="Total growth"
                size="sm"
                value={formatMoney(attribution.total, currency)}
              />
              <Figure
                label="You contributed"
                size="sm"
                value={formatMoney(attribution.contributions, currency)}
              />
              <Figure
                label="The market did"
                size="sm"
                tone={attribution.market >= 0 ? "gain" : "loss"}
                value={formatMoney(attribution.market, currency)}
              />
            </FigureRow>
            {attribution.total > 0 && (
              <div
                aria-hidden
                className="mt-4 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-wash-strong"
              >
                <div
                  className="h-full rounded-full bg-ink"
                  style={{
                    width: `${clamp((attribution.contributions / attribution.total) * 100)}%`,
                  }}
                />
                <div
                  className="h-full rounded-full bg-gain"
                  style={{
                    width: `${clamp((attribution.market / attribution.total) * 100)}%`,
                  }}
                />
              </div>
            )}
            <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">
              Contributions follow the monthly rate each snapshot recorded, and
              today&apos;s rate for snapshots taken before that was kept. Treat
              it as orientation, not an audit.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
