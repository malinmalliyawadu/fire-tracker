import { LineChart, TrendingDown, TrendingUp } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePlanTracking } from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlanTrackingCard() {
  const { comparison, attribution } = usePlanTracking();
  const currency = useSettings((s) => s.settings.displayCurrency);

  if (!comparison && !attribution) {
    return (
      <Card eyebrow="Reality check" title="Actual vs plan">
        <EmptyState
          description="Once there are two snapshots at least a month apart, this compares where you actually are against where the plan said you'd be, and splits your growth into contributions versus market."
          icon={LineChart}
          title="Not enough history yet"
        />
      </Card>
    );
  }

  const ahead = (comparison?.delta ?? 0) >= 0;

  return (
    <Card eyebrow="Reality check" title="Actual vs plan">
      <div className="space-y-5">
        {comparison && (
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  {ahead ? "Ahead of plan" : "Behind plan"}
                </div>
                <div
                  className={
                    "mt-1 flex items-center gap-2 font-mono tabular text-3xl font-semibold tracking-tight " +
                    (ahead ? "text-gain" : "text-loss")
                  }
                >
                  {ahead ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                  {ahead ? "+" : "-"}
                  {formatMoney(Math.abs(comparison.delta), currency)}
                </div>
              </div>
              <div className="text-right text-[11px] leading-relaxed text-ink-400">
                <div>
                  Plan expected {formatMoney(comparison.expected, currency)}
                </div>
                <div className="mt-0.5">
                  You have {formatMoney(comparison.actual, currency)}
                </div>
                <div className="mt-0.5 text-ink-500">
                  over {comparison.yearsTracked.toFixed(1)} years tracked
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-ink-500">
              {formatPercent(Math.abs(comparison.deltaPercent), 1)}{" "}
              {ahead ? "above" : "below"} the projection anchored at your first
              snapshot.
            </div>
          </div>
        )}

        {attribution && (
          <div className="border-t border-white/5 pt-5">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Where the growth came from
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Figure
                label="Total growth"
                value={formatMoney(attribution.total, currency)}
              />
              <Figure
                label="You contributed"
                tone="accent"
                value={formatMoney(attribution.contributions, currency)}
              />
              <Figure
                label="Market did"
                tone={attribution.market >= 0 ? "gain" : "loss"}
                value={formatMoney(attribution.market, currency)}
              />
            </div>
            {attribution.total > 0 && (
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${clamp(
                      (attribution.contributions / attribution.total) * 100,
                    )}%`,
                  }}
                />
                <div
                  className="h-full bg-gain"
                  style={{
                    width: `${clamp((attribution.market / attribution.total) * 100)}%`,
                  }}
                />
              </div>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
              Contributions are estimated from your current monthly rate across
              the tracked window, so a rate that changed partway through will
              smear. Treat it as orientation, not an audit.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

function Figure({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "gain" | "loss" | "accent";
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        {label}
      </div>
      <div
        className={
          "mt-1 font-mono tabular text-lg font-semibold tracking-tight " +
          (tone === "gain"
            ? "text-gain"
            : tone === "loss"
              ? "text-loss"
              : tone === "accent"
                ? "text-accent"
                : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}
