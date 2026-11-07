import type { Currency } from "@/types";

import { useSettings } from "@/store/settings";
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
      lede="Ages anchor every projection; the currency is how everything is shown."
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
          <NumericCard
            allowDecimal={false}
            grouping={false}
            label="Current age"
            size="sm"
            value={settings.currentAge}
            onChange={(v) => update({ currentAge: v ?? 0 })}
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
