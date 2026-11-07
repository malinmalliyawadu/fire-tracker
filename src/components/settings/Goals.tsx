import clsx from "clsx";

import { formatMoneyCompact, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useFireTargets, usePlanBudget } from "@/store/derived";
import { AmountInput } from "@/components/ui/AmountInput";
import { Section } from "@/components/ui/Section";
import { SliderField } from "@/components/ui/SliderField";

export function Goals() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  // Read the live target rather than recomputing it, so this section can't
  // drift from the rest of the app once expenses are itemised on Cash flow.
  const targets = useFireTargets();
  const budget = usePlanBudget();
  const currency = settings.displayCurrency;

  return (
    <Section
      aside={
        <span className="num text-[13px] text-ink-2">
          Target {formatMoneyCompact(targets.traditional, currency)}
        </span>
      }
      id="goals"
      lede="What retirement costs, and the rates that turn it into a number."
      title="Goals"
    >
      <div className="space-y-6">
        <div
          className={clsx(budget.itemised && "pointer-events-none opacity-60")}
        >
          <AmountInput
            currency={currency}
            hint={
              budget.itemised ? (
                <>
                  Superseded by the itemised expenses on Cash flow:{" "}
                  <span className="num">
                    {formatMoneyCompact(budget.annualExpenses, currency)}
                  </span>{" "}
                  today,{" "}
                  <span className="num">
                    {formatMoneyCompact(budget.retirementExpenses, currency)}
                  </span>{" "}
                  in retirement. The target is built from the retirement figure.
                </>
              ) : (
                "In today's dollars. Itemise it on Cash flow to model costs that stop or start at retirement."
              )
            }
            label="Annual expenses"
            size="md"
            value={settings.annualExpenses}
            onChange={(v) => update({ annualExpenses: v ?? 0 })}
          />
        </div>

        <SliderField
          display={formatPercent(settings.withdrawalRate, 1)}
          hint="The 4% rule is the usual anchor; lower is safer"
          label="Withdrawal rate"
          max={0.06}
          min={0.025}
          step={0.001}
          value={settings.withdrawalRate}
          onChange={(v) => update({ withdrawalRate: v })}
        />

        <SliderField
          display={formatPercent(settings.expectedReturn, 1)}
          hint="Long-run nominal return on investments, before tax"
          label="Expected return"
          max={0.15}
          min={0}
          step={0.001}
          value={settings.expectedReturn}
          onChange={(v) => update({ expectedReturn: v })}
        />

        <SliderField
          display={formatPercent(settings.inflationRate, 1)}
          hint="Taken off the return so projections stay in today's dollars"
          label="Inflation"
          max={0.06}
          min={0}
          step={0.001}
          value={settings.inflationRate}
          onChange={(v) => update({ inflationRate: v })}
        />
      </div>
    </Section>
  );
}
