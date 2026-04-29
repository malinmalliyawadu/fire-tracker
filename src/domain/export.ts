import type { Asset, Liability, Scenario, Settings } from "@/types";
import type { NetWorthSnapshot } from "@/store/history";

import {
  ASSET_TYPE_LABEL,
  FIRE_TYPE_META,
  FREQUENCY_LABEL,
  LIABILITY_TYPE_LABEL,
} from "./labels";
import { computeFireTargets, fireTargetFor, yearsToFire } from "./fire";
import { convert, toMonthly } from "./currency";
import { formatMoney, formatPercent, formatYears } from "./format";

export interface SnapshotInput {
  settings: Settings;
  assets: Asset[];
  liabilities: Liability[];
  scenarios: Scenario[];
  history?: NetWorthSnapshot[];
}

interface Totals {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  monthlyContributions: number;
  monthlyDebtPayments: number;
  lockedAssetsTotal: number;
  lockedMonthlyContributions: number;
}

const computeTotals = (
  assets: Asset[],
  liabilities: Liability[],
  settings: Settings,
): Totals => {
  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;

  let assetsTotal = 0;
  let lockedAssetsTotal = 0;
  let monthlyContributions = 0;
  let lockedMonthlyContributions = 0;

  for (const a of assets) {
    const v = convert(a.value, a.currency, display, rate);
    const m = toMonthly(
      convert(a.contribution, a.currency, display, rate),
      a.frequency,
    );

    assetsTotal += v;
    monthlyContributions += m;
    if (a.type === "kiwisaver") {
      lockedAssetsTotal += v;
      lockedMonthlyContributions += m;
    }
  }

  const liabilitiesTotal = liabilities.reduce(
    (sum, l) => sum + convert(l.balance, l.currency, display, rate),
    0,
  );
  const monthlyDebtPayments = liabilities.reduce(
    (sum, l) =>
      sum +
      toMonthly(convert(l.payment, l.currency, display, rate), l.frequency),
    0,
  );

  return {
    assetsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal - liabilitiesTotal,
    monthlyContributions,
    monthlyDebtPayments,
    lockedAssetsTotal,
    lockedMonthlyContributions,
  };
};

const targetRow = (label: string, target: number, settings: Settings, totals: Totals): string => {
  const years = yearsToFire({
    netWorth: totals.netWorth,
    monthlyContribution: totals.monthlyContributions,
    target,
    expectedReturn: settings.expectedReturn,
  });
  const pct = target > 0 ? Math.min(100, (totals.netWorth / target) * 100) : 0;

  return `| ${label} | ${formatMoney(target, settings.displayCurrency)} | ${pct.toFixed(1)}% | ${formatYears(years)} |`;
};

export const buildSnapshotMarkdown = (input: SnapshotInput): string => {
  const { settings, assets, liabilities, scenarios, history = [] } = input;
  const display = settings.displayCurrency;
  const totals = computeTotals(assets, liabilities, settings);
  const targets = computeFireTargets({
    annualExpenses: settings.annualExpenses,
    withdrawalRate: settings.withdrawalRate,
    expectedReturn: settings.expectedReturn,
    inflationRate: settings.inflationRate,
    currentAge: settings.currentAge,
    retirementAge: settings.retirementAge,
  });

  const lines: string[] = [];

  lines.push(`# FIRE Tracker Snapshot`);
  lines.push(``);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(
    `> All amounts shown in **${display}** unless explicitly noted otherwise.`,
  );
  lines.push(``);

  // Profile
  lines.push(`## Profile`);
  lines.push(``);
  lines.push(`- Current age: **${settings.currentAge}**`);
  lines.push(`- Retirement age: **${settings.retirementAge}**`);
  lines.push(
    `- Years to retirement: **${Math.max(0, settings.retirementAge - settings.currentAge)}**`,
  );
  lines.push(`- Display currency: **${display}**`);
  lines.push(
    `- Annual expenses: **${formatMoney(settings.annualExpenses, display)}**`,
  );
  lines.push(
    `- Safe withdrawal rate: **${formatPercent(settings.withdrawalRate, 2)}**`,
  );
  lines.push(
    `- Expected nominal return: **${formatPercent(settings.expectedReturn, 2)}**`,
  );
  lines.push(`- Inflation rate: **${formatPercent(settings.inflationRate, 2)}**`);
  lines.push(
    `- Real return (nominal − inflation): **${formatPercent(settings.expectedReturn - settings.inflationRate, 2)}**`,
  );
  lines.push(`- USD → NZD rate: **${settings.usdToNzd.toFixed(4)}**`);
  if (settings.exchangeRateUpdatedAt) {
    lines.push(`- FX last fetched: ${settings.exchangeRateUpdatedAt}`);
  }
  lines.push(``);

  // NZ Super
  lines.push(`## NZ Super`);
  lines.push(``);
  lines.push(
    `- Annual amount: **${formatMoney(settings.nzSuperAnnual ?? 0, "NZD")}** (in NZD)`,
  );
  lines.push(`- Eligibility age: **${settings.nzSuperStartAge ?? 65}**`);
  lines.push(``);

  // KiwiSaver lock
  lines.push(`## KiwiSaver Access`);
  lines.push(``);
  lines.push(`- Unlock age: **${settings.kiwisaverUnlockAge ?? 65}**`);
  lines.push(
    `- Locked balance today: **${formatMoney(totals.lockedAssetsTotal, display)}**`,
  );
  lines.push(
    `- Monthly contributions to KiwiSaver: **${formatMoney(totals.lockedMonthlyContributions, display)}**`,
  );
  lines.push(
    `- Accessible (non-KiwiSaver) net worth: **${formatMoney(totals.netWorth - totals.lockedAssetsTotal, display)}**`,
  );
  lines.push(``);

  // Net Worth Summary
  lines.push(`## Net Worth`);
  lines.push(``);
  lines.push(`- **Net worth: ${formatMoney(totals.netWorth, display)}**`);
  lines.push(`- Total assets: ${formatMoney(totals.assetsTotal, display)}`);
  lines.push(
    `- Total liabilities: ${formatMoney(totals.liabilitiesTotal, display)}`,
  );
  lines.push(
    `- Monthly contributions to assets: ${formatMoney(totals.monthlyContributions, display)}`,
  );
  lines.push(
    `- Monthly debt payments: ${formatMoney(totals.monthlyDebtPayments, display)}`,
  );
  lines.push(
    `- Total monthly outflow into wealth-building: ${formatMoney(totals.monthlyContributions + totals.monthlyDebtPayments, display)}`,
  );
  lines.push(``);

  // FIRE Targets
  lines.push(`## FIRE Targets & Progress`);
  lines.push(``);
  lines.push(`| Type | Target | Progress | Time to reach |`);
  lines.push(`| :--- | ---: | ---: | ---: |`);
  (["traditional", "lean", "fat", "coast"] as const).forEach((type) => {
    const target = fireTargetFor(type, targets);

    lines.push(
      targetRow(
        `${FIRE_TYPE_META[type].label} — ${FIRE_TYPE_META[type].description}`,
        target,
        settings,
        totals,
      ),
    );
  });
  lines.push(``);

  // Assets
  lines.push(`## Assets (${assets.length})`);
  lines.push(``);
  if (assets.length === 0) {
    lines.push(`_No assets recorded._`);
  } else {
    lines.push(
      `| Name | Type | Value (orig) | Currency | Value (${display}) | Contribution | Frequency | Monthly equiv. (${display}) | Notes |`,
    );
    lines.push(
      `| :--- | :--- | ---: | :---: | ---: | ---: | :---: | ---: | :--- |`,
    );
    for (const a of assets) {
      const valueDisplay = convert(a.value, a.currency, display, settings.usdToNzd);
      const monthlyDisplay = toMonthly(
        convert(a.contribution, a.currency, display, settings.usdToNzd),
        a.frequency,
      );

      lines.push(
        `| ${a.name} | ${ASSET_TYPE_LABEL[a.type]} | ${formatMoney(a.value, a.currency)} | ${a.currency} | ${formatMoney(valueDisplay, display)} | ${formatMoney(a.contribution, a.currency)} | ${FREQUENCY_LABEL[a.frequency]} | ${formatMoney(monthlyDisplay, display)} | ${a.notes ?? ""} |`,
      );
    }
  }
  lines.push(``);

  // Liabilities
  lines.push(`## Liabilities (${liabilities.length})`);
  lines.push(``);
  if (liabilities.length === 0) {
    lines.push(`_No liabilities recorded._`);
  } else {
    lines.push(
      `| Name | Type | Balance (orig) | Currency | Balance (${display}) | Rate | Payment | Frequency | Monthly equiv. (${display}) |`,
    );
    lines.push(
      `| :--- | :--- | ---: | :---: | ---: | ---: | ---: | :---: | ---: |`,
    );
    for (const l of liabilities) {
      const balanceDisplay = convert(
        l.balance,
        l.currency,
        display,
        settings.usdToNzd,
      );
      const monthlyDisplay = toMonthly(
        convert(l.payment, l.currency, display, settings.usdToNzd),
        l.frequency,
      );

      lines.push(
        `| ${l.name} | ${LIABILITY_TYPE_LABEL[l.type]} | ${formatMoney(l.balance, l.currency)} | ${l.currency} | ${formatMoney(balanceDisplay, display)} | ${formatPercent(l.interestRate, 2)} | ${formatMoney(l.payment, l.currency)} | ${FREQUENCY_LABEL[l.frequency]} | ${formatMoney(monthlyDisplay, display)} |`,
      );
    }
  }
  lines.push(``);

  // Saved Scenarios
  lines.push(`## Saved Scenarios (${scenarios.length})`);
  lines.push(``);
  if (scenarios.length === 0) {
    lines.push(`_No scenarios saved yet._`);
  } else {
    for (const s of scenarios) {
      const scenarioTarget = fireTargetFor(s.inputs.fireType, targets);
      const scenarioYears = yearsToFire({
        netWorth: totals.netWorth,
        monthlyContribution: s.inputs.monthlySavings,
        target: scenarioTarget,
        expectedReturn: s.inputs.expectedReturn,
      });

      lines.push(`### ${s.name}`);
      lines.push(``);
      lines.push(`- FIRE type: **${FIRE_TYPE_META[s.inputs.fireType].label}**`);
      lines.push(
        `- Monthly savings: **${formatMoney(s.inputs.monthlySavings, display)}** (annual: ${formatMoney(s.inputs.monthlySavings * 12, display)})`,
      );
      lines.push(
        `- Expected return: **${formatPercent(s.inputs.expectedReturn, 2)}**`,
      );
      lines.push(
        `- Withdrawal rate: **${formatPercent(s.inputs.withdrawalRate, 2)}**`,
      );
      lines.push(`- Retirement age: **${s.inputs.retirementAge}**`);
      lines.push(
        `- Includes NZ Super: **${s.inputs.includeNzSuper ? "yes" : "no"}**`,
      );
      lines.push(`- Implied target: ${formatMoney(scenarioTarget, display)}`);
      lines.push(`- Time to reach target: **${formatYears(scenarioYears)}**`);
      lines.push(`- Saved: ${s.createdAt}`);
      lines.push(``);
    }
  }

  // History
  lines.push(`## Net Worth History (${history.length})`);
  lines.push(``);
  if (history.length === 0) {
    lines.push(`_No snapshots yet._`);
  } else {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = last.netWorth - first.netWorth;

    lines.push(
      `- First snapshot: **${formatMoney(first.netWorth, display)}** on ${first.date.slice(0, 10)}`,
    );
    lines.push(
      `- Latest snapshot: **${formatMoney(last.netWorth, display)}** on ${last.date.slice(0, 10)}`,
    );
    lines.push(
      `- Change since first: **${delta >= 0 ? "+" : ""}${formatMoney(delta, display)}**`,
    );
    lines.push(``);
    lines.push(`| Date | Net worth | Assets | Liabilities |`);
    lines.push(`| :--- | ---: | ---: | ---: |`);
    for (const s of sorted) {
      lines.push(
        `| ${s.date.slice(0, 10)} | ${formatMoney(s.netWorth, display)} | ${formatMoney(s.assetsTotal, display)} | ${formatMoney(s.liabilitiesTotal, display)} |`,
      );
    }
  }
  lines.push(``);

  // Methodology footer
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Methodology`);
  lines.push(``);
  lines.push(
    `Projections use real returns (nominal return − inflation) so all future amounts are in today's purchasing power. The 4%-rule "traditional" FIRE target equals \`annualExpenses / withdrawalRate\`. Lean = 60% of traditional, Fat = 150%, Coast discounts traditional by the real return over years remaining to retirement age. NZ Super, when enabled per scenario, reduces required portfolio withdrawals from its eligibility age onward. KiwiSaver assets are treated as a locked pot that compounds untouched and is unavailable for withdrawals before the unlock age — so any retirement that begins before that age must be funded from accessible (non-KiwiSaver) assets alone.`,
  );

  return lines.join("\n");
};

export const buildSnapshotJson = (input: SnapshotInput): string => {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      ...input,
    },
    null,
    2,
  );
};
