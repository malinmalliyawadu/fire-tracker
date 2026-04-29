import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Lock, PieChart as PieIcon } from "lucide-react";

import {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
} from "@/domain/labels";
import { formatMoney, formatMoneyCompact, formatPercent } from "@/domain/format";
import { useAllocation } from "@/store/derived";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function AllocationCard() {
  const { slices, total, topType, topPercent, diversityScore } = useAllocation();
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;

  if (slices.length === 0) {
    return (
      <Card eyebrow="Diversification" title="Asset Allocation">
        <EmptyState
          description="Add assets to see how your portfolio is split across investment types."
          icon={PieIcon}
          title="Nothing to break down yet"
        />
      </Card>
    );
  }

  const concentrationLabel =
    topPercent >= 0.7
      ? "Highly concentrated"
      : topPercent >= 0.5
        ? "Concentrated"
        : topPercent >= 0.35
          ? "Balanced"
          : "Well diversified";
  const concentrationTone =
    topPercent >= 0.7
      ? "text-loss"
      : topPercent >= 0.5
        ? "text-amber-400"
        : "text-gain";

  return (
    <Card
      action={
        <span className={`text-[11px] uppercase tracking-[0.18em] ${concentrationTone}`}>
          {concentrationLabel}
        </span>
      }
      eyebrow="Diversification"
      title="Asset Allocation"
    >
      <div className="grid items-center gap-8 md:grid-cols-[260px_1fr]">
        <div className="relative flex justify-center">
          <div className="h-[240px] w-[240px]">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cornerRadius={3}
                  data={slices as unknown as Array<Record<string, unknown>>}
                  dataKey="value"
                  endAngle={-270}
                  innerRadius={75}
                  isAnimationActive
                  nameKey="type"
                  outerRadius={108}
                  paddingAngle={2}
                  startAngle={90}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={1}
                >
                  {slices.map((s) => (
                    <Cell key={s.type} fill={ASSET_TYPE_COLOR[s.type]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Portfolio
            </div>
            <div className="mt-1 font-mono tabular text-2xl font-semibold tracking-tight">
              {formatMoneyCompact(total, currency)}
            </div>
            <div className="mt-1 text-[10px] text-ink-400">
              {slices.length} {slices.length === 1 ? "type" : "types"} ·{" "}
              {formatPercent(diversityScore, 0)} diverse
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {slices.map((s) => {
            const Icon = ASSET_TYPE_ICON[s.type];
            const isLocked = s.type === "kiwisaver";

            return (
              <div
                key={s.type}
                className="group flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 transition-colors hover:border-white/[0.08] hover:bg-white/[0.03]"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ASSET_TYPE_COLOR[s.type] }}
                />
                <Icon
                  className="h-3.5 w-3.5 shrink-0 text-ink-400"
                  strokeWidth={2}
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {ASSET_TYPE_LABEL[s.type]}
                  {isLocked && (
                    <Lock className="ml-1.5 inline h-2.5 w-2.5 text-accent" />
                  )}
                </span>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-mono tabular text-sm font-semibold">
                    {formatMoney(s.value, currency)}
                  </span>
                  <span className="font-mono tabular text-[11px] text-ink-400">
                    {formatPercent(s.percent, 1)}
                  </span>
                </div>
              </div>
            );
          })}

          {topType && topPercent >= 0.5 && (
            <p className="mt-2 text-[11px] text-ink-400">
              {formatPercent(topPercent, 0)} of your portfolio sits in{" "}
              <span className="text-ink-200">
                {ASSET_TYPE_LABEL[topType]}
              </span>
              .{" "}
              {topPercent >= 0.7
                ? "Consider whether this concentration matches your risk tolerance."
                : "Diversifying further may reduce volatility."}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
