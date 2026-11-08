import type { BenchmarkComparison } from "@/domain/benchmark";
import type { Currency } from "@/types";

import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatMoneyCompact } from "@/domain/format";

const SERIES = [
  {
    key: "actual",
    label: "Your investments",
    stroke: "var(--ink)",
    dashed: false,
  },
  {
    key: "benchmark",
    label: "Same money in the S&P 500",
    stroke: "var(--note)",
    dashed: false,
  },
  {
    key: "paidIn",
    label: "Money paid in",
    stroke: "var(--ink-3)",
    dashed: true,
  },
] as const;

function Swatch({ stroke, dashed }: { stroke: string; dashed: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block w-4 shrink-0 border-t-2"
      style={{
        borderColor: stroke,
        borderTopStyle: dashed ? "dashed" : "solid",
      }}
    />
  );
}

interface BenchmarkChartProps {
  comparison: BenchmarkComparison;
  currency: Currency;
}

/** Your money, the same money in the index, and what actually went in. */
export function BenchmarkChart({ comparison, currency }: BenchmarkChartProps) {
  const data = useMemo(
    () =>
      comparison.path.map((p) => ({ ...p, ts: parseISO(p.date).getTime() })),
    [comparison.path],
  );
  const latest = comparison.path[comparison.path.length - 1];
  const tickFormat = comparison.years > 0.75 ? "MMM yy" : "d MMM";

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-1.5">
        {SERIES.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 text-[13px] text-ink-3"
          >
            <Swatch dashed={s.dashed} stroke={s.stroke} />
            {s.label}
            <span className="num font-medium text-ink">
              {formatMoney(latest[s.key], currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="h-[300px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--line-soft)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="ts"
              domain={["dataMin", "dataMax"]}
              minTickGap={48}
              tickFormatter={(v) => format(new Date(v), tickFormat)}
              tickLine={false}
              tickMargin={8}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => formatMoneyCompact(v, currency)}
              tickLine={false}
              tickMargin={6}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as (typeof data)[number];

                return (
                  <div className="rounded-lg border border-line-soft bg-surface px-3 py-2 shadow-pop">
                    <div className="mb-1 text-[13px] text-ink-3">
                      {format(parseISO(point.date), "d MMM yyyy")}
                    </div>
                    <dl className="space-y-0.5">
                      {SERIES.map((s) => (
                        <div
                          key={s.key}
                          className="flex items-center justify-between gap-5 text-[13px]"
                        >
                          <dt className="flex items-center gap-2 text-ink-2">
                            <Swatch dashed={s.dashed} stroke={s.stroke} />
                            {s.label}
                          </dt>
                          <dd className="num font-medium text-ink">
                            {formatMoney(point[s.key], currency)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--line)" }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                activeDot={{
                  r: 4,
                  fill: s.stroke,
                  stroke: "var(--bg)",
                  strokeWidth: 2,
                }}
                dataKey={s.key}
                dot={false}
                isAnimationActive={false}
                name={s.label}
                stroke={s.stroke}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                strokeWidth={s.dashed ? 1.5 : 2}
                type="linear"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
