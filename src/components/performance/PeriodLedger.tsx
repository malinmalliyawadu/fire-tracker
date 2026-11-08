import type { BenchmarkId, PerformancePeriod } from "@/domain/benchmark";

import clsx from "clsx";
import { format, parseISO } from "date-fns";

import { formatPercent } from "@/domain/format";
import { BENCHMARK_STYLE } from "@/components/performance/benchmarks";
import { Ledger, LedgerHead, LedgerRow, Td, Th } from "@/components/ui/Ledger";
import { TONE_TEXT } from "@/components/ui/Figure";

const day = (iso: string) => format(parseISO(iso), "d MMM yy");

const percent = (value: number) =>
  `${value < 0 ? "−" : ""}${formatPercent(Math.abs(value), 1)}`;

/** Under a twentieth of a point rounds to nothing, so it has no sign. */
const points = (gap: number): { text: string; ahead: boolean | null } => {
  const value = gap * 100;

  if (Math.abs(value) < 0.05) return { text: "0.0 pts", ahead: null };

  return {
    text: `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)} pts`,
    ahead: value > 0,
  };
};

interface PeriodLedgerProps {
  periods: PerformancePeriod[];
  shown: BenchmarkId[];
}

/** Each period's return beside the benchmarks over exactly the same dates. */
export function PeriodLedger({ periods, shown }: PeriodLedgerProps) {
  return (
    <Ledger>
      <LedgerHead>
        <Th>Period</Th>
        <Th align="right">You</Th>
        {shown.map((id) => (
          <Th key={id} align="right">
            {BENCHMARK_STYLE[id].short}
          </Th>
        ))}
      </LedgerHead>
      <tbody>
        {periods.map((period) => (
          <LedgerRow key={period.label}>
            <Td className="whitespace-nowrap">
              <div className="font-medium text-ink">{period.label}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                {day(period.from)} to {day(period.to)}
              </div>
            </Td>
            <Td num align="right" className="text-ink">
              {percent(period.periodReturn)}
            </Td>
            {shown.map((id) => {
              const outcome = period.outcomes[id];

              if (!outcome) {
                return (
                  <Td key={id} num align="right" className="text-ink-3">
                    -
                  </Td>
                );
              }

              const gap = points(period.periodReturn - outcome.periodReturn);

              return (
                <Td key={id} num align="right" className="whitespace-nowrap">
                  <div
                    className={clsx(
                      gap.ahead === null
                        ? TONE_TEXT.muted
                        : gap.ahead
                          ? TONE_TEXT.gain
                          : TONE_TEXT.loss,
                    )}
                  >
                    {gap.text}
                  </div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                    {percent(outcome.periodReturn)}
                  </div>
                </Td>
              );
            })}
          </LedgerRow>
        ))}
      </tbody>
    </Ledger>
  );
}
