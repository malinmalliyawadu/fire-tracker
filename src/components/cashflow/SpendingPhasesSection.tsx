import type { Currency } from "@/types";
import type { ReactNode } from "react";

import { TrendingDown } from "lucide-react";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePlanBudget } from "@/store/derived";
import { Section } from "@/components/ui/Section";
import { SliderField } from "@/components/ui/SliderField";
import { ToggleRow } from "@/components/ui/ToggleRow";

export function SpendingPhasesSection() {
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
    <Section
      lede="Retirement spending rarely stays flat. Scale it for the active years, the slower years and the late years."
      title="Spending phases"
    >
      <div className="space-y-6">
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
          <div className="divide-y divide-line-soft">
            <Phase
              amount={base * phases.goGoMultiplier}
              currency={display}
              label="Go-go years"
              range={`Retirement to ${phases.slowGoFromAge}`}
            >
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
            </Phase>

            <Phase
              amount={base * phases.slowGoMultiplier}
              currency={display}
              label="Slow-go years"
              range={`${phases.slowGoFromAge} to ${phases.noGoFromAge}`}
            >
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
            </Phase>

            <Phase
              amount={base * phases.noGoMultiplier}
              currency={display}
              label="No-go years"
              range={`${phases.noGoFromAge} onwards`}
            >
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
            </Phase>

            <p className="pt-5 text-[13px] leading-relaxed text-ink-3">
              Multipliers apply to retirement spending of{" "}
              {formatMoney(base, display)} a year. Your FIRE target still uses
              the unadjusted figure, so it stays a conservative anchor.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

interface PhaseProps {
  label: string;
  range: string;
  amount: number;
  currency: Currency;
  children: ReactNode;
}

function Phase({ label, range, amount, currency, children }: PhaseProps) {
  return (
    <div className="grid gap-x-10 gap-y-4 py-5 first:pt-0 lg:grid-cols-[220px_1fr]">
      <div>
        <div className="text-[15px] font-medium text-ink">{label}</div>
        <div className="num mt-0.5 text-[12.5px] text-ink-3">{range}</div>
        <div className="num mt-2 text-[17px] font-medium text-ink">
          {formatMoney(amount, currency)}
          <span className="ml-1 text-[13px] font-normal text-ink-3">
            a year
          </span>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
