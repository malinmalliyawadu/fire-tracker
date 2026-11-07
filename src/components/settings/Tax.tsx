import { Receipt } from "lucide-react";

import { formatPercent } from "@/domain/format";
import { PIR_BANDS, PIR_TOP_RATE, TAX_YEAR } from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { useAfterTaxReturn, useIncomeTotals } from "@/store/derived";
import { Field } from "@/components/ui/Field";
import { OptionPills } from "@/components/ui/OptionPills";
import { Panel, Section } from "@/components/ui/Section";
import { ToggleRow } from "@/components/ui/ToggleRow";

const PIR_OPTIONS: ReadonlyArray<{ value: number | null; label: string }> = [
  { value: null, label: "Auto" },
  ...[...PIR_BANDS.map((b) => b.rate), PIR_TOP_RATE].map((rate) => ({
    value: rate as number | null,
    label: formatPercent(rate, 1),
  })),
];

export function Tax() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const income = useIncomeTotals();
  const afterTax = useAfterTaxReturn();

  const derivedPir = income.pir;
  const activePir = settings.pirOverride ?? derivedPir;
  const drag = settings.expectedReturn - afterTax;

  return (
    <Section
      aside={
        <span className="text-[13px] text-ink-3">NZ rules, {TAX_YEAR}</span>
      }
      id="tax"
      lede="Investment tax takes a slice off every year's return."
      title="Tax"
    >
      <div className="space-y-6">
        <ToggleRow
          hint={
            settings.applyInvestmentTax
              ? `Returns reduced by ${formatPercent(drag, 2)} a year`
              : "Projections use pre-tax returns"
          }
          icon={Receipt}
          label="Apply investment tax"
          value={settings.applyInvestmentTax}
          onChange={(v) => update({ applyInvestmentTax: v })}
        />

        {settings.applyInvestmentTax && (
          <>
            <Field
              label="Prescribed investor rate"
              meta={
                settings.pirOverride == null
                  ? `From income: ${formatPercent(derivedPir, 1)}`
                  : "Set by hand"
              }
            >
              <OptionPills
                options={PIR_OPTIONS}
                value={settings.pirOverride ?? null}
                onChange={(v) =>
                  update({ pirOverride: v === null ? undefined : v })
                }
              />
            </Field>

            <Panel tone="wash">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-ink-2">Expected return</span>
                <span className="num text-ink">
                  {formatPercent(settings.expectedReturn, 2)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[14px]">
                <span className="text-ink-2">After investment tax</span>
                <span className="num font-medium text-ink">
                  {formatPercent(afterTax, 2)}
                </span>
              </div>
              <p className="mt-3 max-w-[64ch] text-[13px] leading-relaxed text-ink-3">
                Blended across your holdings. Interest is taxed in full at your
                marginal rate, PIE funds and KiwiSaver at your PIR under the
                Fair Dividend Rate (5% of value deemed income, whether the fund
                rose or fell), and property growth is untaxed. Active PIR:{" "}
                <span className="num">{formatPercent(activePir, 1)}</span>.
              </p>
            </Panel>
          </>
        )}
      </div>
    </Section>
  );
}
