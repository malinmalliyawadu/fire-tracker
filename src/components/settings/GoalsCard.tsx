import { Input } from "@heroui/input";

import { computeFireTargets } from "@/domain/fire";
import { formatMoneyCompact, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/simulate/SliderField";

export function GoalsCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const targets = computeFireTargets({
    annualExpenses: settings.annualExpenses,
    withdrawalRate: settings.withdrawalRate,
    expectedReturn: settings.expectedReturn,
    inflationRate: settings.inflationRate,
    currentAge: settings.currentAge,
    retirementAge: settings.retirementAge,
  });

  return (
    <Card
      action={
        <span className="font-mono tabular text-xs text-ink-300">
          Target: {formatMoneyCompact(targets.traditional, settings.displayCurrency)}
        </span>
      }
      eyebrow="Defaults used everywhere"
      title="FIRE Goals"
    >
      <div className="space-y-5">
        <Input
          inputMode="decimal"
          label="Annual expenses (today's dollars)"
          startContent={
            <span className="text-sm text-ink-400">
              {settings.displayCurrency === "NZD" ? "NZ$" : "US$"}
            </span>
          }
          value={settings.annualExpenses.toString()}
          variant="bordered"
          onValueChange={(v) =>
            update({ annualExpenses: parseFloat(v) || 0 })
          }
        />

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
