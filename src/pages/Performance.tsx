import { format, parseISO } from "date-fns";
import { LineChart } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { usePerformance } from "@/hooks/usePerformance";
import { useSettings } from "@/store/settings";
import { BenchmarkChart } from "@/components/performance/BenchmarkChart";
import { PeriodLedger } from "@/components/performance/PeriodLedger";
import { EmptyState } from "@/components/ui/EmptyState";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { PageIntro, Section } from "@/components/ui/Section";

const LEDE =
  "How your investing is going, measured against the same money put in the S&P 500 on the same dates.";

const percent = (value: number) =>
  `${value < 0 ? "−" : ""}${formatPercent(Math.abs(value), 1)}`;

/** Within half a point is a match rather than a verdict, as on the overview. */
const IN_LINE = 0.005;

function PerYear({ rate }: { rate: number }) {
  return (
    <>
      {percent(rate)}
      <span className="whitespace-nowrap text-[17px]"> a year</span>
    </>
  );
}

export default function Performance() {
  const performance = usePerformance();
  const displayCurrency = useSettings((s) => s.settings.displayCurrency);

  if (!performance) {
    return (
      <div>
        <PageIntro lede={LEDE} title="Performance" />
        <EmptyState
          description="Once two snapshots sit at least a month apart, this compares what your investments have earned with what the S&P 500 would have done with the same money. A snapshot is saved each day you open the app."
          icon={LineChart}
          title="Not enough history yet"
        />
      </div>
    );
  }

  const { overall, periods, currency, dataThrough } = performance;
  const inLine = Math.abs(overall.gap) < IN_LINE;
  const ahead = overall.gap > 0;
  const tone = inLine ? "default" : ahead ? "gain" : "loss";
  const since = format(parseISO(overall.from), "d MMM yyyy");

  return (
    <div className="space-y-16">
      <div>
        <PageIntro lede={LEDE} title="Performance" />
        <FigureRow cols={4}>
          <Figure
            hint={`Since ${since}`}
            label="Your return"
            size="lg"
            value={<PerYear rate={overall.annualised} />}
          />
          <Figure
            hint="Same money, same dates"
            label="S&P 500"
            size="lg"
            value={<PerYear rate={overall.benchmarkAnnualised} />}
          />
          <Figure
            hint={
              inLine
                ? "In line with the index"
                : `${ahead ? "Ahead of" : "Behind"} the index, per year`
            }
            label="Difference"
            size="lg"
            tone={tone}
            value={`${ahead ? "+" : "−"}${(Math.abs(overall.gap) * 100).toFixed(1)} pts`}
          />
          <Figure
            hint={`You have ${formatMoney(overall.actual, displayCurrency)}`}
            label="Same money in the S&P 500"
            size="lg"
            value={formatMoney(overall.benchmark, displayCurrency)}
          />
        </FigureRow>
      </div>

      <Section
        lede="Every contribution buys the index on the date it went into your pot."
        title="Your money against the S&P 500"
      >
        <BenchmarkChart comparison={overall} currency={displayCurrency} />
      </Section>

      <Section
        lede="What each period returned in total, not per year."
        title="By period"
      >
        <PeriodLedger periods={periods} />
      </Section>

      <Section title="How to read this">
        <div className="max-w-[70ch] space-y-3 text-[13.5px] leading-relaxed text-ink-2">
          <p>
            Your return covers everything in the FIRE pot, including cash,
            property and KiwiSaver, after the tax and fees it has already paid.
            The S&amp;P 500 is an all-shares index with dividends reinvested,
            before any tax or fees, so a mixed pot trailing it in a strong year
            is expected.
          </p>
          <p>
            The index is measured in {currency}
            {currency === "NZD" &&
              " with no currency hedging, so a falling kiwi dollar lifts it and a rising one holds it back"}
            . Contributions follow the rate on each snapshot. A holding you add
            or revalue by hand counts as a return, so a jump after an edit is
            the edit, not the market.
            {overall.years < 1 &&
              " With under a year of record, the per-year rates above move with a few weeks of markets; they settle as the record grows."}
          </p>
          <p className="text-ink-3">
            Index figures run to {format(parseISO(dataThrough), "d MMM yyyy")}.
          </p>
        </div>
      </Section>
    </div>
  );
}
