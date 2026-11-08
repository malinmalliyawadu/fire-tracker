import type { BenchmarkId } from "@/domain/benchmark";
import type { PerformanceView } from "@/hooks/usePerformance";
import type { Currency } from "@/types";

import clsx from "clsx";
import { Check } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { BENCHMARK_IDS } from "@/domain/benchmark";
import { BENCHMARK_STYLE } from "@/components/performance/benchmarks";
import { TONE_TEXT } from "@/components/ui/Figure";
import { Ledger, LedgerHead, LedgerRow, Td, Th } from "@/components/ui/Ledger";

const percent = (value: number) =>
  `${value < 0 ? "−" : ""}${formatPercent(Math.abs(value), 1)}`;

/** Within half a point is a match rather than a verdict, as on the overview. */
export const IN_LINE = 0.005;

const hint = (id: BenchmarkId, view: PerformanceView): string => {
  switch (id) {
    case "plan":
      return `The ${formatPercent(view.planRate, 1)} a year your plan counts on`;
    case "inflation":
      return "NZ consumer prices, the line that keeps you level";
    case "global":
      return "World shares, unhedged, dividends reinvested";
    case "sp500":
      return "US shares, unhedged, dividends reinvested";
    case "mix":
      return "Global shares and cash, weighted like your holdings";
    case "mortgage":
      return `Clearing debt at today's ${formatPercent(view.mortgageRate ?? 0, 2)}`;
    case "cash":
      return "NZ 90-day bank rate";
  }
};

function Mark({ on, stroke }: { on: boolean; stroke: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors duration-[var(--dur-hover)]",
        !on && "border-ink-4",
      )}
      style={on ? { background: stroke, borderColor: stroke } : undefined}
    >
      {on && <Check className="h-3 w-3 text-bg" strokeWidth={3.25} />}
    </span>
  );
}

interface BenchmarkPickerProps {
  view: PerformanceView;
  shown: BenchmarkId[];
  currency: Currency;
  onToggle: (id: BenchmarkId) => void;
}

/**
 * The list of benchmarks, each row its own switch. A row that's on reports how
 * you did against it and draws its line; its mark is the chart's legend.
 */
export function BenchmarkPicker({
  view,
  shown,
  currency,
  onToggle,
}: BenchmarkPickerProps) {
  const available = BENCHMARK_IDS.filter((id) => view.overall.outcomes[id]);

  return (
    <Ledger>
      <LedgerHead>
        <Th>Compare against</Th>
        <Th align="right">A year</Th>
        <Th align="right">You, against it</Th>
        <Th align="right" className="hidden sm:table-cell">
          Same money would be
        </Th>
      </LedgerHead>
      <tbody>
        {available.map((id) => {
          const style = BENCHMARK_STYLE[id];
          const outcome = view.overall.outcomes[id]!;
          const on = shown.includes(id);
          const inLine = Math.abs(outcome.gap) < IN_LINE;
          const ahead = outcome.gap > 0;

          return (
            <LedgerRow
              key={id}
              checked={on}
              label={style.label}
              onOpen={() => onToggle(id)}
            >
              <Td>
                <div className="flex items-center gap-3">
                  <Mark on={on} stroke={style.stroke} />
                  <div className="min-w-0">
                    <div
                      className={clsx(
                        "font-medium transition-colors duration-[var(--dur-hover)]",
                        on ? "text-ink" : "text-ink-3",
                      )}
                    >
                      {style.label}
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                      {hint(id, view)}
                    </div>
                  </div>
                </div>
              </Td>
              <Td num align="right" className="whitespace-nowrap text-ink-2">
                {on && percent(outcome.annualised)}
              </Td>
              <Td
                num
                align="right"
                className={clsx(
                  "whitespace-nowrap",
                  inLine
                    ? TONE_TEXT.muted
                    : ahead
                      ? TONE_TEXT.gain
                      : TONE_TEXT.loss,
                )}
              >
                {on &&
                  `${ahead ? "+" : "−"}${(Math.abs(outcome.gap) * 100).toFixed(1)} pts`}
              </Td>
              <Td
                num
                align="right"
                className="hidden whitespace-nowrap text-ink-2 sm:table-cell"
              >
                {on && formatMoney(outcome.value, currency)}
              </Td>
            </LedgerRow>
          );
        })}
      </tbody>
    </Ledger>
  );
}
