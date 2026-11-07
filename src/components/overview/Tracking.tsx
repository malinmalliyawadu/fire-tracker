import { LineChart } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePlanTracking } from "@/store/derived";
import { EmptyState } from "@/components/ui/EmptyState";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { Section } from "@/components/ui/Section";

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

/** How the recorded snapshots compare with what the plan expected. */
export function Tracking() {
  const { comparison, attribution } = usePlanTracking();
  const currency = useSettings((s) => s.settings.displayCurrency);

  if (!comparison && !attribution) {
    return (
      <Section title="Actual against plan">
        <EmptyState
          description="Once two snapshots sit at least a month apart, this compares where you are with where the plan said you would be, and splits the growth into what you put in and what the market did."
          icon={LineChart}
          title="Not enough history yet"
        />
      </Section>
    );
  }

  const ahead = (comparison?.delta ?? 0) >= 0;

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
              <div>over {comparison.yearsTracked.toFixed(1)} years tracked</div>
            </div>
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
              Contributions are estimated from your current monthly rate across
              the tracked window, so a rate that changed partway through will
              smear. Treat it as orientation, not an audit.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
