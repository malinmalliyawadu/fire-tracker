import type { ProjectionPoint, Scenario } from "@/types";

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
}

interface ChartRow {
  year: number;
  age: number;
  current: number;
  accessible?: number;
  [scenarioKey: string]: number | undefined;
}

export function ProjectionChart({
  current,
  comparisons,
  target,
  retirementAge,
  showAccessible = false,
}: ProjectionChartProps) {
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;

  const data: ChartRow[] = current.map((point, i) => {
    const row: ChartRow = {
      year: point.year,
      age: point.age,
      current: point.netWorth,
    };

    if (showAccessible) {
      row.accessible = point.accessible;
    }

    for (const c of comparisons) {
      row[`s_${c.scenario.id}`] = c.projection[i]?.netWorth ?? 0;
    }

    return row;
  });

  return (
    <div className="space-y-3">
      <div className="h-[420px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ top: 32, right: 16, bottom: 4, left: 8 }}
          >
            <defs>
              <linearGradient id="grad-current" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c83e7" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#7c83e7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-accessible" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="age"
              interval="preserveStartEnd"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(v) => formatMoneyCompact(v, currency)}
              tickLine={false}
              tickMargin={6}
              width={64}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                return (
                  <div className="rounded-lg border border-white/10 bg-ink-900/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
                      Age {label}
                    </div>
                    {payload.map((entry) => (
                      <div
                        key={entry.dataKey as string}
                        className="mt-1.5 flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="flex items-center gap-1.5 text-ink-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </span>
                        <span className="font-mono tabular font-semibold">
                          {formatMoney(entry.value as number, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <ReferenceLine
              label={{
                value: "Target",
                position: "insideTopLeft",
                offset: 6,
                fill: "#7c83e7",
                fontSize: 10,
              }}
              stroke="#7c83e7"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              y={target}
            />
            <ReferenceLine
              label={{
                value: `Retire ${retirementAge}`,
                position: "insideTop",
                offset: 8,
                fill: "#94a3b8",
                fontSize: 10,
              }}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
              x={retirementAge}
            />
            {showAccessible && settings.kiwisaverUnlockAge != null && (
              <ReferenceLine
                label={{
                  value: `KS unlock ${settings.kiwisaverUnlockAge}`,
                  position: "insideTop",
                  offset: 8,
                  fill: "#22c55e",
                  fontSize: 10,
                }}
                stroke="rgba(34,197,94,0.35)"
                strokeDasharray="2 4"
                x={settings.kiwisaverUnlockAge}
              />
            )}
            <Area
              animationDuration={500}
              dataKey="current"
              fill="url(#grad-current)"
              isAnimationActive
              name="Total net worth"
              stroke="#7c83e7"
              strokeWidth={2.5}
              type="monotone"
            />
            {showAccessible && (
              <Area
                animationDuration={500}
                dataKey="accessible"
                fill="url(#grad-accessible)"
                isAnimationActive
                name="Accessible"
                stroke="#22c55e"
                strokeWidth={2}
                type="monotone"
              />
            )}
            {comparisons.map((c) => (
              <Line
                key={c.scenario.id}
                animationDuration={400}
                dataKey={`s_${c.scenario.id}`}
                dot={false}
                isAnimationActive
                name={c.scenario.name}
                stroke={c.scenario.color}
                strokeDasharray="6 4"
                strokeWidth={1.75}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-300">
        <LegendDot color="#7c83e7" label="Total net worth" />
        {showAccessible && (
          <>
            <LegendDot color="#22c55e" label="Accessible (excl. KiwiSaver)" />
            <span className="text-ink-500">
              · gap above green = locked KiwiSaver until age{" "}
              {settings.kiwisaverUnlockAge ?? 65}
            </span>
          </>
        )}
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
