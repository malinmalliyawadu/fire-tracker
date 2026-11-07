import clsx from "clsx";
import { Lock, PieChart } from "lucide-react";

import { ASSET_TYPE_COLOR, ASSET_TYPE_LABEL } from "@/domain/labels";
import { formatPercent } from "@/domain/format";
import { useAllocation } from "@/store/derived";
import { useSettings } from "@/store/settings";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";

/** Where the assets sit, as one bar split by type. */
export function Allocation() {
  const { slices, topType, topPercent } = useAllocation();
  const settings = useSettings((s) => s.settings);
  const currency = settings.displayCurrency;
  const unlockAge = settings.kiwisaverUnlockAge ?? 65;

  const concentration =
    topPercent >= 0.7
      ? { label: "Highly concentrated", tone: "text-loss" }
      : topPercent >= 0.5
        ? { label: "Concentrated", tone: "text-note" }
        : topPercent >= 0.35
          ? { label: "Balanced", tone: "text-ink-2" }
          : { label: "Well diversified", tone: "text-gain" };

  return (
    <Section
      aside={
        slices.length > 0 && (
          <span className={clsx("text-[13px]", concentration.tone)}>
            {concentration.label}
          </span>
        )
      }
      title="Where it sits"
    >
      {slices.length === 0 ? (
        <EmptyState
          description="Add assets to see how they split across types."
          icon={PieChart}
          title="Nothing to break down yet"
        />
      ) : (
        <div>
          <div
            aria-hidden
            className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full"
          >
            {slices.map((s) => (
              <div
                key={s.type}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${s.percent * 100}%`,
                  backgroundColor: ASSET_TYPE_COLOR[s.type],
                }}
              />
            ))}
          </div>

          <ul className="mt-4 divide-y divide-line-soft">
            {slices.map((s) => (
              <li
                key={s.type}
                className="flex items-center gap-3 py-2.5 text-[14px]"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ASSET_TYPE_COLOR[s.type] }}
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 font-medium text-ink">
                  {ASSET_TYPE_LABEL[s.type]}
                  {s.type === "kiwisaver" && (
                    <Tag icon={Lock}>Locked to {unlockAge}</Tag>
                  )}
                </span>
                <Money amount={s.value} currency={currency} />
                <span className="num w-12 text-right text-[13px] text-ink-3">
                  {formatPercent(s.percent, 1)}
                </span>
              </li>
            ))}
          </ul>

          {topType && topPercent >= 0.5 && (
            <p className="mt-4 max-w-[60ch] text-[13px] leading-snug text-ink-3">
              {formatPercent(topPercent, 0)} of your assets sit in{" "}
              {ASSET_TYPE_LABEL[topType]}.{" "}
              {topPercent >= 0.7
                ? "Consider whether that concentration matches your appetite for risk."
                : "Spreading further may reduce how much the total swings."}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
