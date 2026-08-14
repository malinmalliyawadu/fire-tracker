import { AlertTriangle, Check, EyeOff, Info } from "lucide-react";

import { usePortfolioTotals, useSanityWarnings } from "@/store/derived";
import { usePortfolio } from "@/store/portfolio";
import { Card } from "@/components/ui/Card";

export function AssumptionsCard() {
  const warnings = useSanityWarnings();
  const { unpairedMortgages } = usePortfolioTotals();
  const setLiabilityFireInclusion = usePortfolio(
    (s) => s.setLiabilityFireInclusion,
  );

  const serious = warnings.filter((w) => w.level === "warning");
  const notes = warnings.filter((w) => w.level === "note");

  /**
   * Warnings are plain domain data, so the fix lives here rather than on the
   * warning itself. Only the ones that have a single unambiguous remedy get a
   * button — the rest are judgement calls the user has to make.
   */
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

  return (
    <Card
      action={
        warnings.length > 0 ? (
          <span
            className={
              "text-[11px] uppercase tracking-[0.18em] " +
              (serious.length > 0 ? "text-loss" : "text-amber-400")
            }
          >
            {serious.length > 0
              ? `${serious.length} to check`
              : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.18em] text-gain">
            All clear
          </span>
        )
      }
      eyebrow="Plausibility"
      title="Assumptions"
    >
      {warnings.length === 0 ? (
        <div className="flex items-center gap-2.5 text-sm text-ink-300">
          <Check className="h-4 w-4 text-gain" />
          Nothing looks internally inconsistent. These are arithmetic checks,
          not advice.
        </div>
      ) : (
        <div className="space-y-2.5">
          {[...serious, ...notes].map((warning) => {
            const isWarning = warning.level === "warning";
            const fix = fixFor(warning.id);

            return (
              <div
                key={warning.id}
                className={
                  "rounded-lg border p-3 " +
                  (isWarning
                    ? "border-loss/20 bg-loss/[0.05]"
                    : "border-amber-500/20 bg-amber-500/[0.04]")
                }
              >
                <div className="flex items-start gap-2.5">
                  {isWarning ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
                  ) : (
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {warning.title}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-300">
                      {warning.detail}
                    </p>
                    {fix && (
                      <button
                        className="mt-2.5 inline-flex items-start gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-xs font-medium text-ink-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                        type="button"
                        onClick={fix.apply}
                      >
                        <EyeOff className="mt-0.5 h-3 w-3 shrink-0" />
                        {fix.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
