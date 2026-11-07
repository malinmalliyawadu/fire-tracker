import type { ProjectionPoint, Scenario } from "@/types";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatMoneyCompact } from "@/domain/format";
import { useSettings } from "@/store/settings";

interface ScenarioSeries {
  scenario: Scenario;
  projection: ProjectionPoint[];
}

interface ProjectionChartProps {
  current: ProjectionPoint[];
  comparisons: ScenarioSeries[];
  target: number;
  retirementAge: number;
  showAccessible?: boolean;
  showDebt?: boolean;
}

interface ChartRow {
  year: number;
  age: number;
  current: number;
  accessible?: number;
  debt?: number;
  [scenarioKey: string]: number | undefined;
}

const LABEL_FONT = { fontSize: 11.5, fontWeight: 500 } as const;

/** True below the `sm` breakpoint, where a second axis would eat the plot. */
const useNarrow = (): boolean => {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 639px)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(media.matches);

    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return narrow;
};

export function ProjectionChart({
  current,
  comparisons,
  target,
  retirementAge,
  showAccessible = false,
  showDebt = false,
}: ProjectionChartProps) {
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;
  const narrow = useNarrow();

  // The debt curve is dwarfed by net worth on a shared axis, so it gets its
  // own scale, and the age it clears is the fact worth calling out.
  const debtFreeAge = showDebt
    ? (current.find((p) => p.debt === 0)?.age ?? null)
    : null;
  const peakDebt = showDebt ? Math.max(...current.map((p) => p.debt), 0) : 0;

  const data: ChartRow[] = current.map((point, i) => {
    const row: ChartRow = {
      year: point.year,
      age: point.age,
      current: point.netWorth,
    };

    if (showAccessible) row.accessible = point.accessible;
    if (showDebt) row.debt = point.debt;

    for (const c of comparisons) {
      row[`s_${c.scenario.id}`] = c.projection[i]?.netWorth ?? 0;
    }

    return row;
  });

  return (
    <div className="space-y-4">
      <div className="h-[440px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ top: 28, right: narrow ? 4 : 12, bottom: 4, left: 0 }}
          >
            <defs>
              <linearGradient id="grad-current" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-accessible" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--gain)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--gain)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line-soft)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="age"
              interval="preserveStartEnd"
              minTickGap={32}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              // Keep the target line inside the plot even when it is the peak.
              domain={[
                (min: number) => Math.min(0, min),
                (max: number) => Math.max(max, target) * 1.06,
              ]}
              tickFormatter={(v) => formatMoneyCompact(v, currency)}
              tickLine={false}
              tickMargin={6}
              width={narrow ? 48 : 62}
              yAxisId="main"
            />
            {showDebt && (
              <YAxis
                axisLine={false}
                domain={[0, peakDebt]}
                hide={narrow}
                orientation="right"
                tick={{ fill: "var(--loss)", fontSize: 11.5 }}
                tickFormatter={(v) => formatMoneyCompact(v, currency)}
                tickLine={false}
                tickMargin={6}
                width={62}
                yAxisId="debt"
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                return (
                  <div className="rounded-lg border border-line-soft bg-surface px-3 py-2 shadow-pop">
                    <div className="text-[13px] text-ink-3">Age {label}</div>
                    {payload.map((entry) => (
                      <div
                        key={entry.dataKey as string}
                        className="mt-1 flex items-center justify-between gap-5 text-[13.5px]"
                      >
                        <span className="flex items-center gap-1.5 text-ink-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </span>
                        <span className="num font-medium text-ink">
                          {formatMoney(entry.value as number, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
              cursor={{ stroke: "var(--line)", strokeDasharray: "3 3" }}
            />
            <ReferenceLine
              label={{
                value: "Target",
                position: "insideTopLeft",
                offset: 6,
                fill: "var(--flame-ink)",
                ...LABEL_FONT,
              }}
              stroke="var(--flame)"
              strokeDasharray="6 5"
              y={target}
              yAxisId="main"
            />
            <ReferenceLine
              label={{
                value: `Stop work ${retirementAge}`,
                position: "insideTopRight",
                offset: 8,
                fill: "var(--ink-3)",
                ...LABEL_FONT,
              }}
              stroke="var(--line)"
              strokeDasharray="3 3"
              x={retirementAge}
              yAxisId="main"
            />
            {debtFreeAge !== null && (
              <ReferenceLine
                label={{
                  value: `Debt free ${debtFreeAge}`,
                  position: "insideBottom",
                  offset: 8,
                  fill: "var(--loss)",
                  ...LABEL_FONT,
                }}
                stroke="var(--loss)"
                strokeDasharray="2 4"
                strokeOpacity={0.5}
                x={debtFreeAge}
                yAxisId="main"
              />
            )}
            {showAccessible && settings.kiwisaverUnlockAge != null && (
              <ReferenceLine
                label={{
                  value: `KiwiSaver unlocks ${settings.kiwisaverUnlockAge}`,
                  position: "insideTopLeft",
                  offset: 8,
                  fill: "var(--gain)",
                  ...LABEL_FONT,
                }}
                stroke="var(--gain)"
                strokeDasharray="2 4"
                strokeOpacity={0.5}
                x={settings.kiwisaverUnlockAge}
                yAxisId="main"
              />
            )}
            <Area
              isAnimationActive
              animationDuration={400}
              dataKey="current"
              fill="url(#grad-current)"
              name="Total net worth"
              stroke="var(--ink)"
              strokeWidth={1.75}
              type="monotone"
              yAxisId="main"
            />
            {showAccessible && (
              <Area
                animationDuration={400}
                dataKey="accessible"
                fill="url(#grad-accessible)"
                isAnimationActive={false}
                name="Accessible"
                stroke="var(--gain)"
                strokeWidth={1.5}
                type="monotone"
                yAxisId="main"
              />
            )}
            {showDebt && (
              <Line
                animationDuration={400}
                dataKey="debt"
                dot={false}
                isAnimationActive={false}
                name="Debt outstanding"
                stroke="var(--loss)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                type="monotone"
                yAxisId="debt"
              />
            )}
            {comparisons.map((c) => (
              <Line
                key={c.scenario.id}
                isAnimationActive
                animationDuration={300}
                dataKey={`s_${c.scenario.id}`}
                dot={false}
                name={c.scenario.name}
                stroke={c.scenario.color}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                type="monotone"
                yAxisId="main"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-ink-2">
        <LegendDot color="var(--ink)" label="Total net worth" />
        {showDebt && (
          <LegendDot
            color="var(--loss)"
            label="Debt outstanding (right axis)"
          />
        )}
        {showAccessible && (
          <LegendDot
            color="var(--gain)"
            label={`Accessible without KiwiSaver (locked until ${settings.kiwisaverUnlockAge ?? 65})`}
          />
        )}
        {comparisons.map((c) => (
          <LegendDot
            key={c.scenario.id}
            color={c.scenario.color}
            label={c.scenario.name}
          />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
