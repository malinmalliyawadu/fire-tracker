import { Input } from "@heroui/input";

import { formatMoneyCompact, formatPercent } from "@/domain/format";
import { useNumericField } from "@/hooks/useNumericField";
import { useSettings } from "@/store/settings";
import { useFireTargets, usePlanBudget } from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/simulate/SliderField";

export function GoalsCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const expensesField = useNumericField({
    value: settings.annualExpenses,
    onChange: (v) => update({ annualExpenses: v ?? 0 }),
  });

  // Read the live target rather than recomputing it, so this card can't drift
  // from the rest of the app once expenses are itemised on the Spending page.
  const targets = useFireTargets();
  const budget = usePlanBudget();

  return (
    <Card
      action={
        <span className="font-mono tabular text-xs text-ink-300">
          Target:{" "}
          {formatMoneyCompact(targets.traditional, settings.displayCurrency)}
        </span>
      }
      eyebrow="Defaults used everywhere"
      title="FIRE Goals"
    >
      <div className="space-y-5">
        <div>
          <Input
            isDisabled={budget.itemised}
            label="Annual expenses (today's dollars)"
            startContent={
              <span className="text-sm text-ink-400">
                {settings.displayCurrency === "NZD" ? "NZ$" : "US$"}
              </span>
            }
            variant="bordered"
            {...expensesField}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
            {budget.itemised ? (
              <>
                Superseded by your itemised expenses on the Spending page:{" "}
                {formatMoneyCompact(
                  budget.annualExpenses,
                  settings.displayCurrency,
                )}{" "}
                today,{" "}
                {formatMoneyCompact(
                  budget.retirementExpenses,
                  settings.displayCurrency,
                )}{" "}
                in retirement. The target is built from the retirement figure.
              </>
            ) : (
              "Itemise this on the Spending page to model costs that stop or start at retirement."
            )}
          </p>
        </div>

        <SliderField
          display={formatPercent(settings.withdrawalRate, 1)}
          hint="Standard 4% rule, lower for safer assumptions"
          label="Withdrawal rate"
          max={0.06}
          min={0.025}
          step={0.001}
          value={settings.withdrawalRate}
          onChange={(v) => update({ withdrawalRate: v })}
        />

        <SliderField
          display={formatPercent(settings.expectedReturn, 1)}
          hint="Long-term nominal investment return"
          label="Expected return"
          max={0.15}
          min={0}
          step={0.001}
          value={settings.expectedReturn}
          onChange={(v) => update({ expectedReturn: v })}
        />

        <SliderField
          display={formatPercent(settings.inflationRate, 1)}
          hint="Subtracted from return for real-dollar projections"
          label="Inflation rate"
          max={0.06}
          min={0}
          step={0.001}
          value={settings.inflationRate}
          onChange={(v) => update({ inflationRate: v })}
        />
      </div>
    </Card>
  );
}
