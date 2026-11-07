import type { NzSuperStatus } from "@/domain/tax";

import clsx from "clsx";
import { Users } from "lucide-react";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import {
  NZ_SUPER_AGE,
  NZ_SUPER_ANNUAL,
  NZ_SUPER_STATUS_LABEL,
} from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { Field } from "@/components/ui/Field";
import { Section } from "@/components/ui/Section";
import { Stepper } from "@/components/ui/Stepper";
import { ToggleRow } from "@/components/ui/ToggleRow";

const STATUSES = Object.keys(NZ_SUPER_ANNUAL) as NzSuperStatus[];

export function Household() {
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

  const gapCaption =
    ageGap === 0
      ? "Same age as you"
      : ageGap > 0
        ? `${ageGap} years younger, so their Super starts when you are ${partnerSuperAtYourAge}`
        : `${Math.abs(ageGap)} years older, so their Super starts when you are ${partnerSuperAtYourAge}`;

  return (
    <Section
      id="household"
      lede="Who the plan is for, and which NZ Super rate applies."
      title="Household"
    >
      <div className="space-y-6">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-3.5 py-3">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-ink">
                  Partner&apos;s age
                </div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                  {gapCaption}
                </div>
              </div>
              <Stepper
                label="partner's age"
                max={90}
                min={18}
                value={household.partnerAge}
                onChange={(v) => setHousehold("partnerAge", v)}
              />
            </div>
            <p className="max-w-[64ch] text-[13px] leading-relaxed text-ink-3">
              Enter both people&apos;s assets and income in the usual lists;
              they are pooled. Only the partner&apos;s age is modelled
              separately, because their NZ Super starts on its own schedule and
              the gap has to come from the portfolio.
            </p>
          </div>
        )}

        <Field label="NZ Super rate">
          <div className="space-y-2">
            {STATUSES.map((status) => {
              const active = settings.nzSuperStatus === status;

              return (
                <button
                  key={status}
                  aria-pressed={active}
                  className={clsx(
                    "press flex w-full items-center justify-between gap-4 rounded-lg border px-3.5 py-3 text-left transition-colors duration-[var(--dur-hover)]",
                    active
                      ? "border-ink bg-ink text-on-ink"
                      : "border-line text-ink hover:border-ink-3",
                  )}
                  type="button"
                  onClick={() =>
                    update({
                      nzSuperStatus: status,
                      nzSuperAnnual: NZ_SUPER_ANNUAL[status],
                    })
                  }
                >
                  <span className="text-[13.5px] font-medium">
                    {NZ_SUPER_STATUS_LABEL[status]}
                  </span>
                  <span
                    className={clsx(
                      "num text-[13.5px]",
                      active ? "text-on-ink/80" : "text-ink-2",
                    )}
                  >
                    {formatMoney(toDisplay(NZ_SUPER_ANNUAL[status]), display)} a
                    year
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 max-w-[64ch] text-[13px] leading-relaxed text-ink-3">
            After tax at the M code, as at April 2025. Rates move every April,
            and a single person living alone gets meaningfully more than one
            sharing a house. Fine-tune the amount under Super and KiwiSaver.
          </p>
        </Field>
      </div>
    </Section>
  );
}
