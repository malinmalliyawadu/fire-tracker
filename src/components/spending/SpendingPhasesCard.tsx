import { TrendingDown } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePlanBudget } from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { SliderField } from "@/components/simulate/SliderField";

export function SpendingPhasesCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const budget = usePlanBudget();

  const phases = settings.spendingPhases;
  const display = settings.displayCurrency;
  const base = budget.retirementExpenses;

  const setPhase = <K extends keyof typeof phases>(
    key: K,
    value: (typeof phases)[K],
  ) => update({ spendingPhases: { ...phases, [key]: value } });

  return (
    <Card eyebrow="Retirement" title="Spending phases">
      <div className="space-y-5">
        <ToggleRow
          hint={
            phases.enabled
              ? "Spending eases off as you slow down"
              : "Spending stays flat for the whole retirement"
          }
          icon={TrendingDown}
          label="Vary spending with age"
          value={phases.enabled}
          onChange={(v) => setPhase("enabled", v)}
        />

        {phases.enabled && (
          <div className="space-y-5">
            <PhaseRow
              amount={base * phases.goGoMultiplier}
              currency={display}
              label="Go-go years"
              multiplier={phases.goGoMultiplier}
              range={`Retirement to ${phases.slowGoFromAge}`}
            />
            <SliderField
              display={formatPercent(phases.goGoMultiplier, 0)}
              hint="Travel and activity while you're fit"
              label="Go-go multiplier"
              max={1.5}
              min={0.8}
              step={0.05}
              value={phases.goGoMultiplier}
              onChange={(v) => setPhase("goGoMultiplier", v)}
            />

            <PhaseRow
              amount={base * phases.slowGoMultiplier}
              currency={display}
              label="Slow-go years"
              multiplier={phases.slowGoMultiplier}
              range={`${phases.slowGoFromAge} to ${phases.noGoFromAge}`}
            />
            <SliderField
              display={`${phases.slowGoFromAge}`}
              hint="Age the slow-go years begin"
              label="Slow-go from"
              max={Math.max(70, phases.noGoFromAge - 1)}
              min={65}
              step={1}
              value={phases.slowGoFromAge}
              onChange={(v) => setPhase("slowGoFromAge", v)}
            />
            <SliderField
              display={formatPercent(phases.slowGoMultiplier, 0)}
              hint="Less travel, steadier spending"
              label="Slow-go multiplier"
              max={1.1}
              min={0.6}
              step={0.05}
              value={phases.slowGoMultiplier}
              onChange={(v) => setPhase("slowGoMultiplier", v)}
            />

            <PhaseRow
              amount={base * phases.noGoMultiplier}
              currency={display}
              label="No-go years"
              multiplier={phases.noGoMultiplier}
              range={`${phases.noGoFromAge}+`}
            />
            <SliderField
              display={`${phases.noGoFromAge}`}
              hint="Age the late years begin"
              label="No-go from"
              max={95}
              min={Math.min(95, phases.slowGoFromAge + 1)}
              step={1}
              value={phases.noGoFromAge}
              onChange={(v) => setPhase("noGoFromAge", v)}
            />
            <SliderField
              display={formatPercent(phases.noGoMultiplier, 0)}
              hint="Lower discretionary spend, though care costs can push the other way"
              label="No-go multiplier"
              max={1.3}
              min={0.5}
              step={0.05}
              value={phases.noGoMultiplier}
              onChange={(v) => setPhase("noGoMultiplier", v)}
            />

            <p className="text-[11px] leading-relaxed text-ink-500">
              Multipliers apply to retirement spending of{" "}
              {formatMoney(base, display)}. Your FIRE target still uses the
              unadjusted figure, so it stays a conservative anchor.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface PhaseRowProps {
  label: string;
  range: string;
  multiplier: number;
  amount: number;
  currency: "NZD" | "USD";
}

function PhaseRow({ label, range, amount, currency }: PhaseRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-0.5 text-[11px] text-ink-400">{range}</div>
      </div>
      <div className="font-mono tabular text-sm font-semibold text-white">
        {formatMoney(amount, currency)}/yr
      </div>
    </div>
  );
}
