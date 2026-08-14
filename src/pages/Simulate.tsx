import type { SimulationInputs } from "@/types";

import { useEffect, useMemo, useState } from "react";

import { convert } from "@/domain/currency";
import { fireTargetFor } from "@/domain/fire";
import {
  generateProjection,
  yearsToTarget as yearsUntilTarget,
} from "@/domain/projection";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import {
  buildProjection,
  KID_ANNUAL_COST_NZD,
  KID_DEPENDENT_YEARS,
} from "@/domain/plan";
import {
  useAfterTaxReturn,
  useFireTargets,
  useIncomeTotals,
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
        currentNetWorth: totals.netWorth,
        monthlySavings: inputs.monthlySavings,
        expectedReturn: simulatedAfterTaxReturn,
        retirementAge: inputs.retirementAge,
        includeNzSuper: inputs.includeNzSuper,
        currentLockedNetWorth: totals.lockedAssetsTotal,
        monthlyLockedSavings: lockedShare,
        includeKids: inputs.includeKids,
        numberOfKids: inputs.numberOfKids,
        liabilities: totals.debts,
        retirementIncome: income.retirementIncomeAnnual,
      },
      settings,
      PROJECTION_YEARS,
    );
  }, [
    totals,
    contributions,
    inputs,
    settings,
    simulatedAfterTaxReturn,
    income.retirementIncomeAnnual,
  ]);

  const yearsToTarget = useMemo(
    () => yearsUntilTarget(currentProjection, target),
    [currentProjection, target],
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
        const kids = scenario.inputs.includeKids
          ? Math.max(0, scenario.inputs.numberOfKids ?? 0)
          : 0;
        const kidsAnnualCost =
          kids > 0
            ? convert(
                KID_ANNUAL_COST_NZD * kids,
                "NZD",
                settings.displayCurrency,
                settings.usdToNzd,
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
            kidsAnnualCost,
            kidsYears: KID_DEPENDENT_YEARS,
            liabilities: totals.debts,
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
            showDebt={totals.debts.length > 0}
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
