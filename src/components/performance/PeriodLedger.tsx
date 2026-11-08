import type { PerformancePeriod } from "@/domain/benchmark";

import clsx from "clsx";
import { format, parseISO } from "date-fns";

import { formatPercent } from "@/domain/format";
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

/** Each period's return beside the index's over exactly the same dates. */
export function PeriodLedger({ periods }: { periods: PerformancePeriod[] }) {
  return (
    <Ledger cols={[undefined, "18%", "18%", "18%"]}>
      <LedgerHead>
        <Th>Period</Th>
        <Th align="right">You</Th>
        <Th align="right">S&amp;P 500</Th>
        <Th align="right">Difference</Th>
      </LedgerHead>
      <tbody>
        {periods.map((period) => {
          const gap = points(
            period.periodReturn - period.benchmarkPeriodReturn,
          );

          return (
            <LedgerRow key={period.label}>
              <Td className="max-w-0">
                <div className="font-medium text-ink">{period.label}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                  {day(period.from)} to {day(period.to)}
                </div>
              </Td>
              <Td num align="right" className="text-ink">
                {percent(period.periodReturn)}
              </Td>
              <Td num align="right" className="text-ink-2">
                {percent(period.benchmarkPeriodReturn)}
              </Td>
              <Td
                num
                align="right"
                className={clsx(
                  "whitespace-nowrap",
                  gap.ahead === null
                    ? TONE_TEXT.muted
                    : gap.ahead
                      ? TONE_TEXT.gain
                      : TONE_TEXT.loss,
                )}
              >
                {gap.text}
              </Td>
            </LedgerRow>
          );
        })}
      </tbody>
    </Ledger>
  );
}
