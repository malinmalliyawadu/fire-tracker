import type { ProjectionPoint } from "@/types";
import type { CoastPoint } from "@/domain/projection";

import { formatMoneyCompact, formatYears } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Figure, FigureRow } from "@/components/ui/Figure";

interface SimulationKPIsProps {
  yearsToTarget: number;
  target: number;
  projection: ProjectionPoint[];
  retirementAge: number;
  coast: CoastPoint | null;
}

const lastsUntilAge = (
  projection: ProjectionPoint[],
  retirementAge: number,
): number | null => {
  let lastPositiveAge: number | null = null;

  for (const p of projection) {
    if (p.age < retirementAge) continue;
    // Use accessible: locked KiwiSaver before unlock age can't pay bills.
    if (p.accessible > 0) lastPositiveAge = p.age;
    else break;
  }

  return lastPositiveAge;
};

/** The five answers a simulation gives, rolling as the controls move. */
export function SimulationKPIs({
  yearsToTarget,
  target,
  projection,
  retirementAge,
  coast,
}: SimulationKPIsProps) {
  const currency = useSettings((s) => s.settings.displayCurrency);

  const peak = Math.max(...projection.map((p) => p.netWorth));
  const lastsAge = lastsUntilAge(projection, retirementAge);
  const horizon = projection.at(-1)?.age ?? 90;
  const lasts = lastsAge !== null && lastsAge >= horizon - 1;

  const money = (v: number) => formatMoneyCompact(v, currency);

  return (
    <FigureRow cols={5}>
      <Figure
        label="Time to FIRE"
        tone="flame"
        value={formatYears(yearsToTarget)}
      />
      <Figure
        label="Target"
        value={<AnimatedNumber format={money} value={target} />}
      />
      <Figure
        label="Could coast from"
        tone={coast !== null ? "gain" : "default"}
        value={
          coast === null
            ? "Not yet"
            : coast.year === 0
              ? "Now"
              : `Age ${coast.age}`
        }
      />
      <Figure
        label="Peak net worth"
        value={<AnimatedNumber format={money} value={peak} />}
      />
      <Figure
        label="Money lasts"
        tone={lasts ? "gain" : "loss"}
        value={
          lasts
            ? "Forever"
            : lastsAge !== null
              ? `Age ${lastsAge}`
              : "Underfunded"
        }
      />
    </FigureRow>
  );
}
