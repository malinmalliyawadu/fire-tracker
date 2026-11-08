import type { BenchmarkId } from "@/domain/benchmark";

import { format, parseISO } from "date-fns";
import { LineChart } from "lucide-react";

import { BENCHMARK_IDS } from "@/domain/benchmark";
import { formatMoney, formatPercent } from "@/domain/format";
import { usePerformance } from "@/hooks/usePerformance";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { BenchmarkChart } from "@/components/performance/BenchmarkChart";
import {
  BenchmarkPicker,
  IN_LINE,
} from "@/components/performance/BenchmarkPicker";
import { BENCHMARK_STYLE } from "@/components/performance/benchmarks";
import { PeriodLedger } from "@/components/performance/PeriodLedger";
import { EmptyState } from "@/components/ui/EmptyState";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { PageIntro, Section } from "@/components/ui/Section";
import { Segmented } from "@/components/ui/Segmented";

const LEDE =
  "How your investing is going, measured against what the same money would have done elsewhere on the same dates.";

const percent = (value: number) =>
  `${value < 0 ? "−" : ""}${formatPercent(Math.abs(value), 1)}`;

const joined = (names: string[]): string =>
  names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/** A benchmark's name partway through a sentence. */
const inSentence = (id: BenchmarkId): string => {
  const { label } = BENCHMARK_STYLE[id];

  return id === "sp500" ? label : label[0].toLowerCase() + label.slice(1);
};

const TAX_OPTIONS = [
  { value: "after", label: "After tax" },
  { value: "before", label: "Before tax" },
] as const;

export default function Performance() {
  const performance = usePerformance();
  const displayCurrency = useSettings((s) => s.settings.displayCurrency);
  const hidden = useUi((s) => s.benchmarksHidden);
  const toggle = useUi((s) => s.toggleBenchmark);
  const afterTax = useUi((s) => s.benchmarksAfterTax);
  const setAfterTax = useUi((s) => s.setBenchmarksAfterTax);

  if (!performance) {
    return (
      <div>
        <PageIntro lede={LEDE} title="Performance" />
        <EmptyState
          description="Once two snapshots sit at least a month apart, this compares what your investments have earned with your plan, inflation, the share markets and more. A snapshot is saved each day you open the app."
          icon={LineChart}
          title="Not enough history yet"
        />
      </div>
    );
  }

  const { overall, periods, currency, dataThrough, shareTaxDrag } = performance;
  const since = format(parseISO(overall.from), "d MMM yyyy");
  const shown: BenchmarkId[] = BENCHMARK_IDS.filter(
    (id) => overall.outcomes[id] && !hidden.includes(id),
  );
  const behind = shown.filter((id) => overall.outcomes[id]!.gap <= -IN_LINE);
  const ahead = shown.filter((id) => overall.outcomes[id]!.gap >= IN_LINE);
  const earned = overall.actual - overall.paidIn;

  return (
    <div className="space-y-16">
      <div>
        <PageIntro lede={LEDE} title="Performance" />
        <FigureRow cols={3}>
          <Figure
            hint={`Since ${since}`}
            label="Your return"
            size="lg"
            value={
              <>
                {percent(overall.annualised)}
                <span className="whitespace-nowrap text-[17px]"> a year</span>
              </>
            }
          />
          <Figure
            hint={
              shown.length === 0
                ? "Switch a comparison on below"
                : behind.length === 0
                  ? "Not behind any of them"
                  : `Behind ${joined(behind.map(inSentence))}`
            }
            label="Ahead of"
            size="lg"
            value={
              shown.length === 0
                ? "None on"
                : `${ahead.length} of ${shown.length}`
            }
          />
          <Figure
            className="col-span-2 sm:col-span-1"
            hint={`You have ${formatMoney(overall.actual, displayCurrency)}`}
            label="Earned beyond what you put in"
            size="lg"
            tone={earned < 0 ? "loss" : "default"}
            value={`${earned < 0 ? "−" : ""}${formatMoney(Math.abs(earned), displayCurrency)}`}
          />
        </FigureRow>
      </div>

      <Section
        lede="Switch any of these on or off. Every contribution goes in on the date it went into your pot."
        title="Your money against the alternatives"
      >
        <BenchmarkPicker
          currency={displayCurrency}
          shown={shown}
          view={performance}
          onToggle={toggle}
        />
        <div className="mt-4 flex items-center justify-between gap-6 border-t border-line pt-4">
          <p className="text-[13px] leading-snug text-ink-3">
            Your pot has already paid its tax, so the fair reading of shares and
            interest is after it.
          </p>
          <Segmented
            ariaLabel="Measure shares and interest before or after tax"
            options={TAX_OPTIONS}
            size="sm"
            value={afterTax ? "after" : "before"}
            onChange={(value) => setAfterTax(value === "after")}
          />
        </div>
        <div className="mt-10">
          <BenchmarkChart
            comparison={overall}
            currency={displayCurrency}
            shown={shown}
          />
        </div>
      </Section>

      <Section
        lede="What each period returned in total, not per year, and how far you were ahead or behind."
        title="By period"
      >
        <PeriodLedger periods={periods} shown={shown} />
      </Section>

      <Section title="How to read this">
        <div className="max-w-[70ch] space-y-3 text-[13.5px] leading-relaxed text-ink-2">
          <p>
            Your return covers everything in the FIRE pot, including cash,
            property and KiwiSaver, after the tax and fees it has already paid.
            {afterTax
              ? ` So the comparison is fair, the indices have tax taken off too: ${(shareTaxDrag * 100).toFixed(1)} points a year of Fair Dividend Rate on shares, and income tax on interest. They are still before fund fees.`
              : " Before tax, the indices keep money your pot has already paid away, so they are flattered."}{" "}
            A mixed pot trailing an all-shares index in a strong year is
            expected, which is what your mix in indices is for: it holds global
            shares and cash in your proportions, reads KiwiSaver as 80% shares,
            and leaves out property and crypto, which have no fair index here.
            Snapshots from before your mix was recorded use today&apos;s.
          </p>
          <p>
            The share indices are measured in {currency}
            {currency === "NZD" &&
              " with no currency hedging, so a falling kiwi dollar lifts them and a rising one holds them back"}
            . Your mortgage is shown at today&apos;s rate for the whole record,
            and your plan at the return it assumes now. Contributions follow the
            rate on each snapshot. A holding you add or revalue by hand counts
            as a return, so a jump after an edit is the edit, not the market.
            {overall.years < 1 &&
              " With under a year of record, the per-year rates above move with a few weeks of markets; they settle as the record grows."}
          </p>
          <p className="text-ink-3">
            Markets run to {format(parseISO(dataThrough), "d MMM yyyy")}.
            Inflation and bank rates are official figures published with a lag,
            and carry on at their latest pace until the next release.
          </p>
        </div>
      </Section>
    </div>
  );
}
