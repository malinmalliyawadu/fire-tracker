import type { BenchmarkComparison, BenchmarkId } from "@/domain/benchmark";
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
import { BENCHMARK_STYLE } from "@/components/performance/benchmarks";

type LineStyle = "solid" | "dashed" | "dotted";

const DASH: Record<LineStyle, string | undefined> = {
  solid: undefined,
  dashed: "5 4",
  dotted: "1.5 3.5",
};

interface ChartSeries {
  key: string;
  label: string;
  stroke: string;
  line: LineStyle;
}

const YOURS: ChartSeries = {
  key: "actual",
  label: "Your investments",
  stroke: "var(--ink)",
  line: "solid",
};
const PAID_IN: ChartSeries = {
  key: "paidIn",
  label: "Money paid in",
  stroke: "var(--ink-3)",
  line: "dashed",
};

function Swatch({ stroke, line }: { stroke: string; line: LineStyle }) {
  return (
    <span
      aria-hidden
      className="inline-block w-4 shrink-0 border-t-2"
      style={{
        borderColor: stroke,
        borderTopStyle: line,
      }}
    />
  );
}

interface BenchmarkChartProps {
  comparison: BenchmarkComparison;
  currency: Currency;
  shown: BenchmarkId[];
}

/** Your money, the same money elsewhere, and what actually went in. */
export function BenchmarkChart({
  comparison,
  currency,
  shown,
}: BenchmarkChartProps) {
  const data = useMemo(
    () =>
      comparison.path.map(
        (p): Record<string, number | string> => ({
          ...p.benchmarks,
          actual: p.actual,
          paidIn: p.paidIn,
          date: p.date,
          ts: parseISO(p.date).getTime(),
        }),
      ),
    [comparison.path],
  );
  const series: ChartSeries[] = [
    YOURS,
    ...shown.map((id) => ({
      key: id,
      label: BENCHMARK_STYLE[id].label,
      stroke: BENCHMARK_STYLE[id].stroke,
      line: BENCHMARK_STYLE[id].line,
    })),
    PAID_IN,
  ];
  const latest = comparison.path[comparison.path.length - 1];
  const tickFormat = comparison.years > 0.75 ? "MMM yy" : "d MMM";

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-1.5">
        {[YOURS, PAID_IN].map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 text-[13px] text-ink-3"
          >
            <Swatch line={s.line} stroke={s.stroke} />
            {s.label}
            <span className="num font-medium text-ink">
              {formatMoney(
                s === YOURS ? latest.actual : latest.paidIn,
                currency,
              )}
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
                      {format(parseISO(String(point.date)), "d MMM yyyy")}
                    </div>
                    <dl className="space-y-0.5">
                      {series.map((s) => (
                        <div
                          key={s.key}
                          className="flex items-center justify-between gap-5 text-[13px]"
                        >
                          <dt className="flex items-center gap-2 text-ink-2">
                            <Swatch line={s.line} stroke={s.stroke} />
                            {s.label}
                          </dt>
                          <dd className="num font-medium text-ink">
                            {formatMoney(Number(point[s.key]), currency)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--line)" }}
            />
            {/* Drawn in reverse so your own line ends up on top. */}
            {[...series].reverse().map((s) => (
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
                strokeDasharray={DASH[s.line]}
                strokeWidth={s === PAID_IN ? 1.5 : 2}
                type="linear"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
