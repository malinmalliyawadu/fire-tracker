import clsx from "clsx";
import { Receipt } from "lucide-react";

import { formatPercent } from "@/domain/format";
import { PIR_TOP_RATE, PIR_BANDS, TAX_YEAR } from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { useAfterTaxReturn, useIncomeTotals } from "@/store/derived";
import { Card } from "@/components/ui/Card";

const PIR_OPTIONS = [...PIR_BANDS.map((b) => b.rate), PIR_TOP_RATE];

export function TaxCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const income = useIncomeTotals();
  const afterTax = useAfterTaxReturn();

  const derivedPir = income.pir;
  const activePir = settings.pirOverride ?? derivedPir;
  const drag = settings.expectedReturn - afterTax;

  return (
    <Card eyebrow={`NZ rules · ${TAX_YEAR}`} title="Investment tax">
      <div className="space-y-5">
        <button
          aria-pressed={settings.applyInvestmentTax}
          className={clsx(
            "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
            settings.applyInvestmentTax
              ? "border-accent/40 bg-accent/10"
              : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
          )}
          type="button"
          onClick={() =>
            update({ applyInvestmentTax: !settings.applyInvestmentTax })
          }
        >
          <div
            className={clsx(
              "grid h-9 w-9 place-items-center rounded-lg transition-colors",
              settings.applyInvestmentTax
                ? "bg-accent text-white"
                : "bg-white/[0.05] text-ink-300",
            )}
          >
            <Receipt className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              Apply investment tax
            </div>
            <div className="mt-0.5 text-[11px] text-ink-400">
              {settings.applyInvestmentTax
                ? `Returns reduced by ${formatPercent(drag, 2)} a year`
                : "Projections use pre-tax returns"}
            </div>
          </div>
          <div
            className={clsx(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              settings.applyInvestmentTax ? "bg-accent" : "bg-white/15",
            )}
          >
            <div
              className={clsx(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                settings.applyInvestmentTax ? "left-[18px]" : "left-0.5",
              )}
            />
          </div>
        </button>

        {settings.applyInvestmentTax && (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">
                  Prescribed Investor Rate
                </span>
                <span className="text-[11px] text-ink-400">
                  {settings.pirOverride == null
                    ? `Derived from income: ${formatPercent(derivedPir, 1)}`
                    : "Manual"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  className={clsx(
                    "rounded-md border px-2.5 py-1 text-xs transition",
                    settings.pirOverride == null
                      ? "border-accent/40 bg-accent/10 text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                  )}
                  type="button"
                  onClick={() => update({ pirOverride: undefined })}
                >
                  Auto
                </button>
                {PIR_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    className={clsx(
                      "rounded-md border px-2.5 py-1 text-xs transition",
                      settings.pirOverride === rate
                        ? "border-accent/40 bg-accent/10 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                    )}
                    type="button"
                    onClick={() => update({ pirOverride: rate })}
                  >
                    {formatPercent(rate, 1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-300">Expected return</span>
                <span className="font-mono tabular">
                  {formatPercent(settings.expectedReturn, 2)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-ink-300">After investment tax</span>
                <span className="font-mono tabular font-semibold text-accent">
                  {formatPercent(afterTax, 2)}
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                Blended across your holdings. Interest is taxed in full at your
                marginal rate, PIE funds and KiwiSaver at your PIR under the
                Fair Dividend Rate (5% of value deemed income, whether the fund
                rose or fell), and property growth is untaxed. Active PIR:{" "}
                {formatPercent(activePir, 1)}.
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
