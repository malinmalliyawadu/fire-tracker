import { Input } from "@heroui/input";
import { Landmark } from "lucide-react";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import { useNumericField } from "@/hooks/useNumericField";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

export function NzSuperCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const annual = settings.nzSuperAnnual ?? 28_000;
  const startAge = settings.nzSuperStartAge ?? 65;

  const annualField = useNumericField({
    value: annual,
    onChange: (v) => update({ nzSuperAnnual: v ?? 0 }),
  });
  const startAgeField = useNumericField({
    value: startAge,
    onChange: (v) => update({ nzSuperStartAge: v ?? 65 }),
    allowDecimal: false,
    grouping: false,
  });

  const inDisplay = convert(
    annual,
    "NZD",
    settings.displayCurrency,
    settings.usdToNzd,
  );

  return (
    <Card
      action={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-accent">
          <Landmark className="h-4 w-4" />
        </span>
      }
      eyebrow="Government pension"
      title="NZ Super"
    >
      <p className="mb-5 text-sm text-ink-300">
        Configure your expected NZ Super income. Toggle it on per scenario in
        the Simulate page to see how it stretches your portfolio.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Input
          description={
            settings.displayCurrency === "USD"
              ? `≈ ${formatMoney(inDisplay, "USD")} at current FX`
              : "Single, living alone is roughly NZ$28,000/yr (2024)"
          }
          label="Annual NZ Super"
          startContent={<span className="text-sm text-ink-400">NZ$</span>}
          variant="bordered"
          {...annualField}
        />
        <Input
          className="w-32"
          description="Eligibility age"
          label="From age"
          variant="bordered"
          {...startAgeField}
        />
      </div>
    </Card>
  );
}
