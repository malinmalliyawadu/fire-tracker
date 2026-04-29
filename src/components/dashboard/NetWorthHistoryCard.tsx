import {
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@heroui/button";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useMemo } from "react";

import { formatMoney, formatMoneyCompact, formatPercent } from "@/domain/format";
import { useHistory } from "@/store/history";
import { usePortfolioTotals } from "@/store/derived";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";

export function NetWorthHistoryCard() {
  const snapshots = useHistory((s) => s.snapshots);
  const takeSnapshot = useHistory((s) => s.takeSnapshot);
  const totals = usePortfolioTotals();
  const currency = useSettings((s) => s.settings.displayCurrency);

  const data = useMemo(
    () =>
      [...snapshots]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({
          date: s.date,
          ts: parseISO(s.date).getTime(),
          netWorth: s.netWorth,
        })),
    [snapshots],
  );

  const handleSnapshot = () => {
    takeSnapshot({
      netWorth: totals.netWorth,
      assetsTotal: totals.assetsTotal,
      liabilitiesTotal: totals.liabilitiesTotal,
      currency,
    });
  };

  if (data.length < 2) {
    return (
      <Card
        action={
          <Button
            size="sm"
            startContent={<Camera className="h-3.5 w-3.5" />}
            variant="flat"
            onPress={handleSnapshot}
          >
            Take snapshot
          </Button>
        }
        eyebrow="Trend"
        title="Net Worth History"
      >
        <EmptyState
          description="Snapshots are saved automatically as you edit your portfolio. Come back tomorrow to see your trend, or take one manually now."
          icon={TrendingUp}
          title={
            data.length === 0
              ? "No snapshots yet"
              : "Need at least 2 snapshots to chart"
          }
        />
      </Card>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  const totalDelta = last.netWorth - first.netWorth;
  const totalPct = first.netWorth !== 0 ? totalDelta / Math.abs(first.netWorth) : 0;
  const isUp = totalDelta >= 0;

  // Last 30 days delta
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const ref30 = data.find((d) => d.ts >= cutoff30) ?? first;
  const delta30 = last.netWorth - ref30.netWorth;

  return (
    <Card
      action={
        <Button
          size="sm"
          startContent={<Camera className="h-3.5 w-3.5" />}
          variant="flat"
          onPress={handleSnapshot}
        >
          Snapshot
        </Button>
      }
      eyebrow={`${data.length} snapshots · since ${formatDistanceToNow(parseISO(first.date), { addSuffix: true })}`}
      title="Net Worth History"
    >
      <div className="mb-5 grid grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Started at
          </div>
          <div className="mt-1 font-mono tabular text-lg font-semibold tracking-tight">
            {formatMoneyCompact(first.netWorth, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {format(parseISO(first.date), "d MMM yyyy")}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
            All-time change
          </div>
          <div
            className={`mt-1 inline-flex items-center gap-1 font-mono tabular text-lg font-semibold tracking-tight ${isUp ? "text-gain" : "text-loss"}`}
          >
            {isUp ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <Money amount={Math.abs(totalDelta)} currency={currency} />
          </div>
          <div className="mt-0.5 font-mono tabular text-[11px] text-ink-400">
            {isUp ? "+" : "−"}
            {formatPercent(Math.abs(totalPct), 1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Last 30 days
          </div>
          <div
            className={`mt-1 font-mono tabular text-lg font-semibold tracking-tight ${delta30 >= 0 ? "text-gain" : "text-loss"}`}
          >
            {delta30 >= 0 ? "+" : "−"}
            {formatMoneyCompact(Math.abs(delta30), currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            vs {format(parseISO(ref30.date), "d MMM")}
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 4, left: 8 }}
          >
            <defs>
              <linearGradient id="grad-history" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isUp ? "#22c55e" : "#ef4444"}
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor={isUp ? "#22c55e" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="ts"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => format(new Date(v), "d MMM")}
              tickLine={false}
              tickMargin={8}
              type="number"
            />
            <YAxis
              axisLine={false}
              tickFormatter={(v) => formatMoneyCompact(v, currency)}
              tickLine={false}
              tickMargin={6}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as {
                  date: string;
                  netWorth: number;
                };

                return (
                  <div className="rounded-lg border border-white/10 bg-ink-900/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
                      {format(parseISO(point.date), "d MMM yyyy")}
                    </div>
                    <div className="mt-1 font-mono tabular text-base font-semibold">
                      {formatMoney(point.netWorth, currency)}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              dataKey="netWorth"
              fill="url(#grad-history)"
              stroke={isUp ? "#22c55e" : "#ef4444"}
              strokeWidth={2.5}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
