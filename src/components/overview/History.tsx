import { Camera, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
} from "@/domain/format";
import { useSnapshotReading } from "@/hooks/useAutoSnapshot";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";

export function History() {
  const snapshots = useHistory((s) => s.snapshots);
  const takeSnapshot = useHistory((s) => s.takeSnapshot);
  const reading = useSnapshotReading();
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

  const handleSnapshot = () => takeSnapshot(reading);

  const snapshotButton = (
    <Button icon={Camera} size="sm" onClick={handleSnapshot}>
      Take snapshot
    </Button>
  );

  if (data.length < 2) {
    return (
      <Section aside={snapshotButton} title="Net worth over time">
        <EmptyState
          description="A snapshot is saved automatically each day you edit the portfolio. Come back tomorrow to see the line, or take one now."
          icon={TrendingUp}
          title={
            data.length === 0
              ? "No snapshots yet"
              : "Two snapshots are needed to draw a line"
          }
        />
      </Section>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  const totalDelta = last.netWorth - first.netWorth;
  const totalPct =
    first.netWorth !== 0 ? totalDelta / Math.abs(first.netWorth) : 0;

  const signed = (amount: number) =>
    `${amount >= 0 ? "+" : "−"}${formatMoney(Math.abs(amount), currency)}`;

  return (
    <Section
      aside={snapshotButton}
      lede={`${data.length} snapshots since ${format(parseISO(first.date), "d MMM yyyy")}, ${signed(totalDelta)} (${formatPercent(Math.abs(totalPct), 1)}) over that time.`}
      title="Net worth over time"
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="grad-history" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line-soft)" vertical={false} />
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
                  <div className="rounded-lg border border-line-soft bg-surface px-3 py-2 shadow-pop">
                    <div className="text-[13px] text-ink-3">
                      {format(parseISO(point.date), "d MMM yyyy")}
                    </div>
                    <div className="num text-[15px] font-medium text-ink">
                      {formatMoney(point.netWorth, currency)}
                    </div>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--line)" }}
            />
            <Area
              dataKey="netWorth"
              fill="url(#grad-history)"
              stroke="var(--ink)"
              strokeWidth={1.75}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
