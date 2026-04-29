import type { SimulationInputs } from "@/types";

import { useEffect, useMemo, useState } from "react";

import { convert } from "@/domain/currency";
import { fireTargetFor, yearsToFire } from "@/domain/fire";
import { generateProjection } from "@/domain/projection";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import {
  buildProjection,
  useFireTargets,
  usePortfolioTotals,
} from "@/store/derived";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ProjectionChart } from "@/components/simulate/ProjectionChart";
import { ScenarioBar } from "@/components/simulate/ScenarioBar";
import { SaveScenarioModal } from "@/components/simulate/SaveScenarioModal";
import { SimulationControls } from "@/components/simulate/SimulationControls";
import { SimulationKPIs } from "@/components/simulate/SimulationKPIs";

const PROJECTION_YEARS = 60;

export default function Simulate() {
  const settings = useSettings((s) => s.settings);
  const totals = usePortfolioTotals();
  const targets = useFireTargets();
  const scenarios = useScenarios((s) => s.scenarios);
  const comparedIds = useScenarios((s) => s.comparedIds);

  const defaults: SimulationInputs = useMemo(
    () => ({
      monthlySavings: Math.max(0, Math.round(totals.monthlyContributions)),
      expectedReturn: settings.expectedReturn,
      withdrawalRate: settings.withdrawalRate,
      retirementAge: settings.retirementAge,
      fireType: "traditional",
      includeNzSuper: false,
    }),
    [totals.monthlyContributions, settings],
  );

  const [inputs, setInputs] = useState<SimulationInputs>(defaults);
  const [saveOpen, setSaveOpen] = useState(false);

  // Reset to current portfolio state if portfolio meaningfully changes
  useEffect(() => {
    setInputs(defaults);
  }, [defaults]);

  const target = fireTargetFor(inputs.fireType, targets);

  const currentProjection = useMemo(() => {
    // Slider can move savings up/down; keep KiwiSaver share proportional.
    const baseTotal = Math.max(0, Math.round(totals.monthlyContributions));
    const lockedShare =
      baseTotal > 0
        ? Math.min(
            inputs.monthlySavings,
            (totals.lockedMonthlyContributions / baseTotal) *
              inputs.monthlySavings,
          )
        : 0;

    return buildProjection(
      {
        currentNetWorth: totals.netWorth,
        monthlySavings: inputs.monthlySavings,
        expectedReturn: inputs.expectedReturn,
        retirementAge: inputs.retirementAge,
        withdrawalRate: inputs.withdrawalRate,
        includeNzSuper: inputs.includeNzSuper,
        currentLockedNetWorth: totals.lockedAssetsTotal,
        monthlyLockedSavings: lockedShare,
      },
      settings,
      PROJECTION_YEARS,
    );
  }, [totals, inputs, settings]);

  const yearsToTarget = useMemo(
    () =>
      yearsToFire({
        netWorth: totals.netWorth,
        monthlyContribution: inputs.monthlySavings,
        target,
        expectedReturn: inputs.expectedReturn,
      }),
    [totals.netWorth, inputs.monthlySavings, inputs.expectedReturn, target],
  );

  const comparedScenarios = useMemo(
    () => scenarios.filter((s) => comparedIds.includes(s.id)),
    [scenarios, comparedIds],
  );

  const comparisons = useMemo(
    () =>
      comparedScenarios.map((scenario) => {
        const annualNzd = settings.nzSuperAnnual ?? 28_000;
        const nzSuperInDisplay = scenario.inputs.includeNzSuper
          ? convert(
              annualNzd,
              "NZD",
              settings.displayCurrency,
              settings.usdToNzd,
            )
          : 0;
        const baseTotal = Math.max(0, Math.round(totals.monthlyContributions));
        const lockedShare =
          baseTotal > 0
            ? Math.min(
                scenario.inputs.monthlySavings,
                (totals.lockedMonthlyContributions / baseTotal) *
                  scenario.inputs.monthlySavings,
              )
            : 0;

        return {
          scenario,
          projection: generateProjection({
            currentNetWorth: totals.netWorth,
            monthlySavings: scenario.inputs.monthlySavings,
            expectedReturn: scenario.inputs.expectedReturn,
            inflationRate: settings.inflationRate,
            currentAge: settings.currentAge,
            retirementAge: scenario.inputs.retirementAge,
            annualExpenses: settings.annualExpenses,
            years: PROJECTION_YEARS,
            nzSuperAnnualInDisplay: nzSuperInDisplay,
            nzSuperStartAge: settings.nzSuperStartAge ?? 65,
            currentLockedNetWorth: totals.lockedAssetsTotal,
            monthlyLockedSavings: lockedShare,
            unlockAge: settings.kiwisaverUnlockAge ?? 65,
          }),
        };
      }),
    [comparedScenarios, totals, settings],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Drag sliders, watch the chart bend. Save scenarios to compare assumptions side-by-side."
        eyebrow="What if?"
        title="Simulate"
      />

      <SimulationKPIs
        projection={currentProjection}
        retirementAge={inputs.retirementAge}
        target={target}
        yearsToTarget={yearsToTarget}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <SimulationControls
          inputs={inputs}
          onChange={setInputs}
          onReset={() => setInputs(defaults)}
        />
        <Card eyebrow="Net worth · today's dollars" title="Projection">
          <ProjectionChart
            comparisons={comparisons}
            current={currentProjection}
            retirementAge={inputs.retirementAge}
            showAccessible={totals.lockedAssetsTotal > 0}
            target={target}
          />
        </Card>
      </div>

      <ScenarioBar onSaveCurrent={() => setSaveOpen(true)} />

      <SaveScenarioModal
        inputs={inputs}
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
      />
    </div>
  );
}
