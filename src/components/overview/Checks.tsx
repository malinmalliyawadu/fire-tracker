import { EyeOff } from "lucide-react";

import { usePortfolioTotals, useSanityWarnings } from "@/store/derived";
import { usePortfolio } from "@/store/portfolio";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Section } from "@/components/ui/Section";

/**
 * Assumption checks. Arithmetic, not advice: things that would quietly make
 * the projection nonsense if left as they are.
 */
export function Checks() {
  const warnings = useSanityWarnings();
  const { unpairedMortgages } = usePortfolioTotals();
  const setLiabilityFireInclusion = usePortfolio(
    (s) => s.setLiabilityFireInclusion,
  );

  const serious = warnings.filter((w) => w.level === "warning");
  const notes = warnings.filter((w) => w.level === "note");

  const fixFor = (id: string) => {
    if (id !== "unpaired-property-debt" || unpairedMortgages.length === 0) {
      return null;
    }

    return {
      label:
        unpairedMortgages.length === 1
          ? `Mark ${unpairedMortgages[0].name} as net worth only`
          : `Mark ${unpairedMortgages.length} mortgages as net worth only`,
      apply: () =>
        setLiabilityFireInclusion(
          unpairedMortgages.map((l) => l.id),
          false,
        ),
    };
  };

  // Silence is the good state; the page only grows a section when something
  // needs reading.
  if (warnings.length === 0) return null;

  const summary =
    serious.length > 0
      ? `${serious.length} to look at`
      : `${notes.length} note${notes.length === 1 ? "" : "s"}`;

  return (
    <Section
      aside={<span className="text-[13px] text-ink-3">{summary}</span>}
      lede="Checks on whether the numbers can work together. They are arithmetic, not advice."
      title="Things to check"
    >
      <ul className="grid gap-x-14 gap-y-6 lg:grid-cols-2">
        {[...serious, ...notes].map((warning) => {
          const fix = fixFor(warning.id);

          return (
            <li key={warning.id}>
              <Callout
                action={
                  fix && (
                    <Button icon={EyeOff} size="sm" onClick={fix.apply}>
                      {fix.label}
                    </Button>
                  )
                }
                title={warning.title}
                tone={warning.level === "warning" ? "warning" : "note"}
              >
                {warning.detail}
              </Callout>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
