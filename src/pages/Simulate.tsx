import type { SimulationInputs } from "@/types";

import { useEffect, useMemo, useState } from "react";

import { fireTargetFor } from "@/domain/fire";
import {
  coastPoint,
  yearsToTarget as yearsUntilTarget,
} from "@/domain/projection";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { buildProjection } from "@/domain/plan";
import {
  useAfterTaxReturn,
  useFireTargets,
  useIncomeTotals,
  usePlanBudget,
  usePlanContributions,
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
  const contributions = usePlanContributions();
  const income = useIncomeTotals();
  const plan = usePlanBudget();
  const targets = useFireTargets();
  const scenarios = useScenarios((s) => s.scenarios);
  const comparedIds = useScenarios((s) => s.comparedIds);

  const defaults: SimulationInputs = useMemo(
    () => ({
      monthlySavings: Math.max(
        0,
        Math.round(contributions.monthlyContributions),
      ),
      expectedReturn: settings.expectedReturn,
      withdrawalRate: settings.withdrawalRate,
      retirementAge: settings.retirementAge,
      fireType: "traditional",
      includeNzSuper: false,
      includeKids: false,
      numberOfKids: 1,
      baristaIncome: 0,
      baristaUntilAge: settings.nzSuperStartAge ?? 65,
    }),
    [contributions.monthlyContributions, settings],
  );

  const [inputs, setInputs] = useState<SimulationInputs>(defaults);
  const [saveOpen, setSaveOpen] = useState(false);

  // Reset to current portfolio state if portfolio meaningfully changes
  useEffect(() => {
    setInputs(defaults);
  }, [defaults]);

  const target = fireTargetFor(inputs.fireType, targets);
  // The slider is a pre-tax return; investment tax is applied on top of it.
  const simulatedAfterTaxReturn = useAfterTaxReturn(inputs.expectedReturn);

  const currentProjection = useMemo(() => {
    // Slider can move savings up/down; keep KiwiSaver share proportional.
    const baseTotal = Math.max(
      0,
      Math.round(contributions.monthlyContributions),
    );
    const lockedShare =
      baseTotal > 0
        ? Math.min(
            inputs.monthlySavings,
            (contributions.monthlyLockedContributions / baseTotal) *
              inputs.monthlySavings,
          )
        : 0;

    return buildProjection(
      {
        currentNetWorth: totals.fireNetWorth,
        monthlySavings: inputs.monthlySavings,
        expectedReturn: simulatedAfterTaxReturn,
        retirementAge: inputs.retirementAge,
        annualExpenses: plan.annualExpenses,
        retirementExpenses: plan.retirementExpenses,
        kidsCostByYear: plan.kidsCostByYear,
        oneOffByYear: plan.oneOffByYear,
        includeNzSuper: inputs.includeNzSuper,
        currentLockedNetWorth: totals.fireLockedAssetsTotal,
        monthlyLockedSavings: lockedShare,
        includeKids: inputs.includeKids,
        numberOfKids: inputs.numberOfKids,
        liabilities: totals.fireDebts,
        retirementIncome: income.retirementIncomeAnnual,
        baristaIncome: inputs.baristaIncome,
        baristaUntilAge: inputs.baristaUntilAge,
      },
      settings,
      PROJECTION_YEARS,
    );
  }, [
    totals,
    contributions,
    inputs,
    plan,
    settings,
    simulatedAfterTaxReturn,
    income.retirementIncomeAnnual,
  ]);

  const yearsToTarget = useMemo(
    () => yearsUntilTarget(currentProjection, target),
    [currentProjection, target],
  );

  const coast = useMemo(
    () =>
      coastPoint(
        currentProjection,
        targets.traditional,
        simulatedAfterTaxReturn - settings.inflationRate,
        inputs.retirementAge,
      ),
    [
      currentProjection,
      targets.traditional,
      simulatedAfterTaxReturn,
      settings.inflationRate,
      inputs.retirementAge,
    ],
  );

  const comparedScenarios = useMemo(
    () => scenarios.filter((s) => comparedIds.includes(s.id)),
    [scenarios, comparedIds],
  );

  const comparisons = useMemo(
    () =>
      comparedScenarios.map((scenario) => {
        const baseTotal = Math.max(
          0,
          Math.round(contributions.monthlyContributions),
        );
        const lockedShare =
          baseTotal > 0
            ? Math.min(
                scenario.inputs.monthlySavings,
                (contributions.monthlyLockedContributions / baseTotal) *
                  scenario.inputs.monthlySavings,
              )
            : 0;

        return {
          scenario,
          projection: buildProjection(
            {
              currentNetWorth: totals.fireNetWorth,
              monthlySavings: scenario.inputs.monthlySavings,
              expectedReturn: scenario.inputs.expectedReturn,
              retirementAge: scenario.inputs.retirementAge,
              annualExpenses: plan.annualExpenses,
              retirementExpenses: plan.retirementExpenses,
              kidsCostByYear: plan.kidsCostByYear,
              oneOffByYear: plan.oneOffByYear,
              includeNzSuper: scenario.inputs.includeNzSuper,
              currentLockedNetWorth: totals.fireLockedAssetsTotal,
              monthlyLockedSavings: lockedShare,
              includeKids: scenario.inputs.includeKids,
              numberOfKids: scenario.inputs.numberOfKids,
              liabilities: totals.fireDebts,
              retirementIncome: income.retirementIncomeAnnual,
              baristaIncome: scenario.inputs.baristaIncome,
              baristaUntilAge: scenario.inputs.baristaUntilAge,
            },
            settings,
            PROJECTION_YEARS,
          ),
        };
      }),
    [comparedScenarios, totals, contributions, plan, income, settings],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Drag sliders, watch the chart bend. Save scenarios to compare assumptions side-by-side."
        eyebrow="What if?"
        title="Simulate"
      />

      <SimulationKPIs
        coast={coast}
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
            showAccessible={totals.fireLockedAssetsTotal > 0}
            showDebt={totals.fireDebts.length > 0}
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
