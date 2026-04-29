import type { ProjectionPoint } from "@/types";

import { CheckCircle2, Hourglass, Target, TrendingUp } from "lucide-react";

import { formatMoneyCompact, formatYears } from "@/domain/format";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

interface SimulationKPIsProps {
  yearsToTarget: number;
  target: number;
  projection: ProjectionPoint[];
  retirementAge: number;
}

const lastsUntilAge = (
  projection: ProjectionPoint[],
  retirementAge: number,
): number | null => {
  let lastPositiveAge: number | null = null;

  for (const p of projection) {
    if (p.age < retirementAge) continue;
    // Use accessible — locked KiwiSaver before unlock age can't pay bills.
    if (p.accessible > 0) lastPositiveAge = p.age;
    else break;
  }

  return lastPositiveAge;
};

export function SimulationKPIs({
  yearsToTarget,
  target,
  projection,
  retirementAge,
}: SimulationKPIsProps) {
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;

  const peak = Math.max(...projection.map((p) => p.netWorth));
  const lastsAge = lastsUntilAge(projection, retirementAge);
  const horizon = projection.at(-1)?.age ?? 90;
  const lasts = lastsAge !== null && lastsAge >= horizon - 1;

  const kpis = [
    {
      label: "Time to FIRE",
      value: formatYears(yearsToTarget),
      icon: Hourglass,
      tone: "accent" as const,
    },
    {
      label: "Target",
      value: formatMoneyCompact(target, currency),
      icon: Target,
      tone: "default" as const,
    },
    {
      label: "Peak net worth",
      value: formatMoneyCompact(peak, currency),
      icon: TrendingUp,
      tone: "default" as const,
    },
    {
      label: "Money lasts",
      value: lasts
        ? "Forever"
        : lastsAge !== null
          ? `Age ${lastsAge}`
          : "Underfunded",
      icon: CheckCircle2,
      tone: (lasts ? "gain" : "loss") as "gain" | "loss",
    },
  ];

  return (
    <Card bodyClassName="p-0">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, idx) => (
          <div
            key={k.label}
            className={
              idx > 0
                ? "border-l border-white/[0.05] px-5 py-4"
                : "px-5 py-4"
            }
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              <k.icon className="h-3 w-3" /> {k.label}
            </div>
            <div
              className={
                "mt-1.5 font-mono tabular text-2xl font-semibold tracking-tight " +
                (k.tone === "gain"
                  ? "text-gain"
                  : k.tone === "loss"
                    ? "text-loss"
                    : k.tone === "accent"
                      ? "text-accent"
                      : "text-white")
              }
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
