import type { NzSuperStatus } from "@/domain/tax";

import clsx from "clsx";
import { Minus, Plus, Users } from "lucide-react";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import {
  NZ_SUPER_AGE,
  NZ_SUPER_ANNUAL,
  NZ_SUPER_STATUS_LABEL,
} from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { Card } from "@/components/ui/Card";
import { ToggleRow } from "@/components/ui/ToggleRow";

const STATUSES = Object.keys(NZ_SUPER_ANNUAL) as NzSuperStatus[];

export function HouseholdCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const household = settings.household;
  const display = settings.displayCurrency;
  const toDisplay = (nzd: number) =>
    convert(nzd, "NZD", display, settings.usdToNzd);

  const setHousehold = <K extends keyof typeof household>(
    key: K,
    value: (typeof household)[K],
  ) => update({ household: { ...household, [key]: value } });

  const ageGap = settings.currentAge - household.partnerAge;
  const partnerSuperAtYourAge =
    (settings.nzSuperStartAge ?? NZ_SUPER_AGE) + ageGap;

  return (
    <Card eyebrow="Who's in the plan" title="Household">
      <div className="space-y-5">
        <ToggleRow
          hint={
            household.hasPartner
              ? "A second NZ Super entitlement, timed to their age"
              : "Just you"
          }
          icon={Users}
          label="Planning with a partner"
          value={household.hasPartner}
          onChange={(v) => setHousehold("hasPartner", v)}
        />

        {household.hasPartner && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-white">
                  Partner&apos;s age
                </div>
                <div className="mt-0.5 text-[11px] text-ink-400">
                  {ageGap === 0
                    ? "Same age as you"
                    : ageGap > 0
                      ? `${ageGap} years younger — their Super starts when you're ${partnerSuperAtYourAge}`
                      : `${Math.abs(ageGap)} years older — their Super starts when you're ${partnerSuperAtYourAge}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Decrease partner's age"
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white"
                  onClick={() =>
                    setHousehold(
                      "partnerAge",
                      Math.max(18, household.partnerAge - 1),
                    )
                  }
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono tabular w-7 text-center text-sm font-semibold">
                  {household.partnerAge}
                </span>
                <button
                  aria-label="Increase partner's age"
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white"
                  onClick={() =>
                    setHousehold(
                      "partnerAge",
                      Math.min(90, household.partnerAge + 1),
                    )
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-ink-500">
              Enter both people&apos;s assets and income in the usual lists —
              they&apos;re pooled. Only the partner&apos;s age is modelled
              separately, because their NZ Super starts on their own schedule
              and that gap has to come from the portfolio.
            </p>
          </>
        )}

        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">
            NZ Super rate
          </div>
          <div className="space-y-1.5">
            {STATUSES.map((status) => (
              <button
                key={status}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition",
                  settings.nzSuperStatus === status
                    ? "border-accent/40 bg-accent/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                )}
                type="button"
                onClick={() =>
                  update({
                    nzSuperStatus: status,
                    nzSuperAnnual: NZ_SUPER_ANNUAL[status],
                  })
                }
              >
                <span>{NZ_SUPER_STATUS_LABEL[status]}</span>
                <span className="font-mono tabular">
                  {formatMoney(toDisplay(NZ_SUPER_ANNUAL[status]), display)}/yr
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            After tax at the M code, as at April 2025. Rates move every April,
            and a single person living alone gets meaningfully more than one
            sharing a house. Fine-tune the amount on the NZ Super card.
          </p>
        </div>
      </div>
    </Card>
  );
}
