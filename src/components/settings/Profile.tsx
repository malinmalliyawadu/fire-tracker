import type { Currency } from "@/types";

import { todayIso } from "@/domain/age";
import { useSettings } from "@/store/settings";
import { DateCard } from "@/components/ui/DateCard";
import { Field } from "@/components/ui/Field";
import { NumericCard } from "@/components/ui/NumericCard";
import { Section } from "@/components/ui/Section";
import { Segmented } from "@/components/ui/Segmented";

const CURRENCIES = [
  { value: "NZD" as Currency, label: "NZD" },
  { value: "USD" as Currency, label: "USD" },
];

export function Profile() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  return (
    <Section
      id="you"
      lede="Every age in the plan is counted from your date of birth; the currency is how everything is shown."
      title="You"
    >
      <div className="space-y-5">
        <Field label="Display currency">
          <Segmented
            ariaLabel="Display currency"
            options={CURRENCIES}
            value={settings.displayCurrency}
            onChange={(c) => update({ displayCurrency: c })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <DateCard
            label="Date of birth"
            max={todayIso()}
            meta={`Age ${settings.currentAge}`}
            size="sm"
            value={settings.birthDate}
            onChange={(v) => update({ birthDate: v })}
          />
          <NumericCard
            allowDecimal={false}
            grouping={false}
            hint={
              settings.retirementAge > settings.currentAge
                ? `${settings.retirementAge - settings.currentAge} years away`
                : "Not in the future"
            }
            label="Retirement age"
            size="sm"
            value={settings.retirementAge}
            onChange={(v) => update({ retirementAge: v ?? 0 })}
          />
        </div>
      </div>
    </Section>
  );
}
