import type { FireType, SimulationInputs } from "@/types";

import clsx from "clsx";
import { Baby, Coffee, Landmark } from "lucide-react";

import { convert } from "@/domain/currency";
import { FIRE_TYPES, FIRE_TYPE_META } from "@/domain/labels";
import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { KID_INDEPENDENT_AGE, kidCostAtAge } from "@/domain/kids";
import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { Field } from "@/components/ui/Field";
import { SliderField } from "@/components/ui/SliderField";
import { Stepper } from "@/components/ui/Stepper";
import { ToggleRow } from "@/components/ui/ToggleRow";

interface SimulationControlsProps {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
}

const FIRE_OPTIONS = FIRE_TYPES.map((type) => ({
  value: type,
  label: FIRE_TYPE_META[type].label,
  hint: FIRE_TYPE_META[type].description,
}));

/** The levers. Grouped by what they are about, separated by hairlines. */
export function SimulationControls({
  inputs,
  onChange,
}: SimulationControlsProps) {
  const settings = useSettings((s) => s.settings);
  const display = settings.displayCurrency;

  const set = <K extends keyof SimulationInputs>(
    key: K,
    value: SimulationInputs[K],
  ) => onChange({ ...inputs, [key]: value });

  return (
    <div className="space-y-5">
      <Field label="Retirement">
        <ChoiceCards<FireType>
          cols={2}
          options={FIRE_OPTIONS}
          value={inputs.fireType}
          onChange={(v) => set("fireType", v)}
        />
      </Field>

      <div className="space-y-5 border-t border-line-soft pt-5">
        <SliderField
          display={`${formatMoney(inputs.monthlySavings, display)} a month`}
          hint={`${formatMoney(inputs.monthlySavings * 12, display)} a year`}
          label="Monthly savings"
          max={20_000}
          min={0}
          step={50}
          value={inputs.monthlySavings}
          onChange={(v) => set("monthlySavings", v)}
        />
        <SliderField
          display={formatPercent(inputs.expectedReturn, 1)}
          hint="Nominal annual return, before investment tax"
          label="Expected return"
          max={0.15}
          min={0}
          step={0.001}
          value={inputs.expectedReturn}
          onChange={(v) => set("expectedReturn", v)}
        />
        <SliderField
          display={formatPercent(inputs.withdrawalRate, 1)}
          hint="Share of the pot drawn each year in retirement"
          label="Withdrawal rate"
          max={0.06}
          min={0.025}
          step={0.001}
          value={inputs.withdrawalRate}
          onChange={(v) => set("withdrawalRate", v)}
        />
        <SliderField
          display={`${inputs.retirementAge}`}
          hint={`Stop work at ${inputs.retirementAge}`}
          label="Retirement age"
          max={75}
          min={Math.max(settings.currentAge + 1, 30)}
          step={1}
          value={inputs.retirementAge}
          onChange={(v) => set("retirementAge", v)}
        />
      </div>

      <div className="space-y-3 border-t border-line-soft pt-5">
        <NzSuperToggle
          enabled={inputs.includeNzSuper}
          onToggle={(v) => set("includeNzSuper", v)}
        />
        <KidsToggle
          enabled={inputs.includeKids}
          numberOfKids={inputs.numberOfKids}
          onCountChange={(v) => set("numberOfKids", v)}
          onToggle={(v) => set("includeKids", v)}
        />
      </div>

      <div className="space-y-5 border-t border-line-soft pt-5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
          <Coffee className="h-3.5 w-3.5" strokeWidth={2} />
          Barista FIRE
        </div>
        <SliderField
          display={
            inputs.baristaIncome > 0
              ? `${formatMoney(inputs.baristaIncome, display)} a year`
              : "Off"
          }
          hint="Part-time earnings that bridge early retirement"
          label="Part-time income"
          max={60_000}
          min={0}
          step={1_000}
          value={inputs.baristaIncome}
          onChange={(v) => set("baristaIncome", v)}
        />
        {inputs.baristaIncome > 0 && (
          <SliderField
            display={`${inputs.baristaUntilAge}`}
            hint={`Working part-time until ${inputs.baristaUntilAge}`}
            label="Until age"
            max={75}
            min={inputs.retirementAge}
            step={1}
            value={inputs.baristaUntilAge}
            onChange={(v) => set("baristaUntilAge", v)}
          />
        )}
      </div>
    </div>
  );
}

interface NzSuperToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

function NzSuperToggle({ enabled, onToggle }: NzSuperToggleProps) {
  const settings = useSettings((s) => s.settings);
  const annual = settings.nzSuperAnnual ?? 28_000;
  const startAge = settings.nzSuperStartAge ?? 65;
  const annualInDisplay = convert(
    annual,
    "NZD",
    settings.displayCurrency,
    settings.usdToNzd,
  );

  return (
    <ToggleRow
      hint={`${formatMoney(annualInDisplay, settings.displayCurrency)} a year from age ${startAge}`}
      icon={Landmark}
      label="Include NZ Super"
      value={enabled}
      onChange={onToggle}
    />
  );
}

interface KidsToggleProps {
  enabled: boolean;
  numberOfKids: number;
  onToggle: (value: boolean) => void;
  onCountChange: (value: number) => void;
}

const MAX_KIDS = 5;

function KidsToggle({
  enabled,
  numberOfKids,
  onToggle,
  onCountChange,
}: KidsToggleProps) {
  const settings = useSettings((s) => s.settings);
  const safeCount = Math.min(MAX_KIDS, Math.max(1, numberOfKids || 1));
  // Costs vary by the child's age; show the first-year figure as the anchor.
  const firstYearAnnual = convert(
    kidCostAtAge(0) * safeCount,
    "NZD",
    settings.displayCurrency,
    settings.usdToNzd,
  );

  return (
    <div
      className={clsx(
        "rounded-lg border transition-colors duration-[var(--dur-hover)]",
        enabled ? "border-ink" : "border-line hover:border-ink-3",
      )}
    >
      <ToggleRow
        bare
        hint={
          enabled
            ? `From ${formatMoney(firstYearAnnual, settings.displayCurrency)} a year, easing off until age ${KID_INDEPENDENT_AGE}`
            : `Cost varies by age: childcare, school, then study, to age ${KID_INDEPENDENT_AGE}`
        }
        icon={Baby}
        label="Plan with kids"
        value={enabled}
        onChange={onToggle}
      />
      {enabled && (
        <div className="flex items-center justify-between gap-3 border-t border-line-soft px-3.5 py-2.5">
          <span className="text-[13px] font-medium text-ink-2">
            Number of kids
          </span>
          <Stepper
            label="number of kids"
            max={MAX_KIDS}
            min={1}
            value={safeCount}
            onChange={onCountChange}
          />
        </div>
      )}
    </div>
  );
}
