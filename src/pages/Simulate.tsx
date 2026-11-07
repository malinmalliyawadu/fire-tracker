import type { SimulationInputs } from "@/types";

import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fireTargetFor } from "@/domain/fire";
import {
  coastPoint,
  yearsToTarget as yearsUntilTarget,
} from "@/domain/projection";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { buildAccumulationProjection, buildProjection } from "@/domain/plan";
import {
  useAfterTaxReturn,
  useFireTargets,
  useIncomeTotals,
  usePlanBudget,
  usePlanContributions,
  usePortfolioTotals,
} from "@/store/derived";
import { Button } from "@/components/ui/Button";
import { PageIntro, Panel } from "@/components/ui/Section";
import { FireLadder } from "@/components/simulate/FireLadder";
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

  const bundle = useMemo(() => {
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

    return {
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
      externalLiabilities: totals.externalDebts,
      retirementIncome: income.retirementIncomeAnnual,
      baristaIncome: inputs.baristaIncome,
      baristaUntilAge: inputs.baristaUntilAge,
    };
  }, [
    totals,
    contributions,
    inputs,
    plan,
    simulatedAfterTaxReturn,
    income.retirementIncomeAnnual,
  ]);

  const currentProjection = useMemo(
    () => buildProjection(bundle, settings, PROJECTION_YEARS),
    [bundle, settings],
  );

  // Time to target is an accumulation question, so it can't be read off a
  // path that stops contributing at the retirement age being simulated.
  const yearsToTarget = useMemo(
    () =>
      yearsUntilTarget(
        buildAccumulationProjection(bundle, settings, PROJECTION_YEARS),
        target,
      ),
    [bundle, settings, target],
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
              externalLiabilities: totals.externalDebts,
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
    <div className="space-y-10">
      <PageIntro
        actions={
          <Button
            icon={RotateCcw}
            size="sm"
            variant="ghost"
            onClick={() => setInputs(defaults)}
          >
            Reset to plan
          </Button>
        }
        lede="Move the controls and watch the path bend. Save a set of assumptions to lay it over the chart."
        title="Simulate"
      />

      <SimulationKPIs
        coast={coast}
        projection={currentProjection}
        retirementAge={inputs.retirementAge}
        target={target}
        yearsToTarget={yearsToTarget}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Panel className="lg:sticky lg:top-20">
          <SimulationControls inputs={inputs} onChange={setInputs} />
        </Panel>
        <div className="space-y-10">
          <Panel>
            <ProjectionChart
              comparisons={comparisons}
              current={currentProjection}
              retirementAge={inputs.retirementAge}
              showAccessible={totals.fireLockedAssetsTotal > 0}
              showDebt={totals.fireDebts.length > 0}
              target={target}
            />
          </Panel>
          <ScenarioBar onSaveCurrent={() => setSaveOpen(true)} />
          <FireLadder />
        </div>
      </div>

      <SaveScenarioModal
        inputs={inputs}
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
      />
    </div>
  );
}
