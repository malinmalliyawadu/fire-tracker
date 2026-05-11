import type { FireType, SimulationInputs } from "@/types";

import clsx from "clsx";
import { Baby, Landmark, Minus, Plus } from "lucide-react";

import { convert } from "@/domain/currency";
import { FIRE_TYPES, FIRE_TYPE_META } from "@/domain/labels";
import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { KID_ANNUAL_COST_NZD, KID_DEPENDENT_YEARS } from "@/store/derived";

import { Card } from "@/components/ui/Card";
import { SliderField } from "./SliderField";

interface SimulationControlsProps {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
  onReset: () => void;
}

export function SimulationControls({
  inputs,
  onChange,
  onReset,
}: SimulationControlsProps) {
  const settings = useSettings((s) => s.settings);
  const display = settings.displayCurrency;

  const set = <K extends keyof SimulationInputs>(
    key: K,
    value: SimulationInputs[K],
  ) => onChange({ ...inputs, [key]: value });

  return (
    <Card
      action={
        <button
          className="text-[11px] uppercase tracking-[0.18em] text-ink-400 transition hover:text-white"
          onClick={onReset}
        >
          Reset
        </button>
      }
      eyebrow="Inputs"
      title="Simulation"
    >
      <div className="space-y-6">
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">
            FIRE type
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FIRE_TYPES.map((type) => (
              <button
                key={type}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-left text-xs transition",
                  inputs.fireType === type
                    ? "border-accent/40 bg-accent/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                )}
                onClick={() => set("fireType", type as FireType)}
              >
                <div className="font-semibold">{FIRE_TYPE_META[type].label}</div>
                <div className="mt-0.5 text-[10px] text-ink-400">
                  {FIRE_TYPE_META[type].description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <SliderField
          display={`${formatMoney(inputs.monthlySavings, display)}/mo`}
          hint={`Annual: ${formatMoney(inputs.monthlySavings * 12, display)}`}
          label="Monthly Savings"
          max={20_000}
          min={0}
          step={50}
          value={inputs.monthlySavings}
          onChange={(v) => set("monthlySavings", v)}
        />

        <SliderField
          display={formatPercent(inputs.expectedReturn, 1)}
          hint="Nominal annual return on investments"
          label="Expected Return"
          max={0.15}
          min={0}
          step={0.001}
          value={inputs.expectedReturn}
          onChange={(v) => set("expectedReturn", v)}
        />

        <SliderField
          display={formatPercent(inputs.withdrawalRate, 1)}
          hint="Safe withdrawal rate at retirement"
          label="Withdrawal Rate"
          max={0.06}
          min={0.025}
          step={0.001}
          value={inputs.withdrawalRate}
          onChange={(v) => set("withdrawalRate", v)}
        />

        <SliderField
          display={`${inputs.retirementAge}`}
          hint={`Retirement at age ${inputs.retirementAge}`}
          label="Retirement Age"
          max={75}
          min={Math.max(settings.currentAge + 1, 30)}
          step={1}
          value={inputs.retirementAge}
          onChange={(v) => set("retirementAge", v)}
        />

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
    </Card>
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
    <button
      aria-pressed={enabled}
      className={clsx(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
        enabled
          ? "border-accent/40 bg-accent/10"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
      )}
      onClick={() => onToggle(!enabled)}
    >
      <div
        className={clsx(
          "grid h-9 w-9 place-items-center rounded-lg transition-colors",
          enabled ? "bg-accent text-white" : "bg-white/[0.05] text-ink-300",
        )}
      >
        <Landmark className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">Include NZ Super</div>
        <div className="mt-0.5 text-[11px] text-ink-400">
          {formatMoney(annualInDisplay, settings.displayCurrency)}/yr from age{" "}
          {startAge}
        </div>
      </div>
      <div
        className={clsx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          enabled ? "bg-accent" : "bg-white/15",
        )}
      >
        <div
          className={clsx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
            enabled ? "left-[18px]" : "left-0.5",
          )}
        />
      </div>
    </button>
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
  const totalAnnual = convert(
    KID_ANNUAL_COST_NZD * safeCount,
    "NZD",
    settings.displayCurrency,
    settings.usdToNzd,
  );

  const adjust = (delta: number) => {
    const next = Math.min(MAX_KIDS, Math.max(1, safeCount + delta));
    onCountChange(next);
  };

  return (
    <div
      className={clsx(
        "rounded-lg border transition",
        enabled
          ? "border-accent/40 bg-accent/10"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
      )}
    >
      <button
        aria-pressed={enabled}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
        onClick={() => onToggle(!enabled)}
      >
        <div
          className={clsx(
            "grid h-9 w-9 place-items-center rounded-lg transition-colors",
            enabled ? "bg-accent text-white" : "bg-white/[0.05] text-ink-300",
          )}
        >
          <Baby className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">
            Plan with kids
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400">
            {enabled
              ? `${formatMoney(totalAnnual, settings.displayCurrency)}/yr for ${KID_DEPENDENT_YEARS} years`
              : `~${formatMoney(convert(KID_ANNUAL_COST_NZD, "NZD", settings.displayCurrency, settings.usdToNzd), settings.displayCurrency)}/yr per kid · ${KID_DEPENDENT_YEARS} yrs`}
          </div>
        </div>
        <div
          className={clsx(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            enabled ? "bg-accent" : "bg-white/15",
          )}
        >
          <div
            className={clsx(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
              enabled ? "left-[18px]" : "left-0.5",
            )}
          />
        </div>
      </button>

      {enabled && (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 py-2.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
            Number of kids
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Decrease number of kids"
              className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white disabled:opacity-40 disabled:hover:border-white/[0.06] disabled:hover:text-ink-300"
              disabled={safeCount <= 1}
              onClick={() => adjust(-1)}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <span className="font-mono tabular w-6 text-center text-sm font-semibold text-white">
              {safeCount}
            </span>
            <button
              aria-label="Increase number of kids"
              className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white disabled:opacity-40 disabled:hover:border-white/[0.06] disabled:hover:text-ink-300"
              disabled={safeCount >= MAX_KIDS}
              onClick={() => adjust(1)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
