import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { AmountInput } from "@/components/ui/AmountInput";
import { NumericCard } from "@/components/ui/NumericCard";
import { Section } from "@/components/ui/Section";

export function Super() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const annual = settings.nzSuperAnnual ?? 28_000;
  const startAge = settings.nzSuperStartAge ?? 65;
  const unlockAge = settings.kiwisaverUnlockAge ?? 65;

  const inDisplay = convert(
    annual,
    "NZD",
    settings.displayCurrency,
    settings.usdToNzd,
  );

  return (
    <Section
      id="super"
      lede="The pension that arrives at 65, and the pot that stays locked until then."
      title="Super and KiwiSaver"
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-[14px] font-medium text-ink">NZ Super</h3>
          <p className="text-[13px] leading-relaxed text-ink-3">
            Switched on per scenario on Simulate, where it offsets retirement
            withdrawals from the eligibility age.
          </p>
          <AmountInput
            currency="NZD"
            hint={
              settings.displayCurrency === "USD"
                ? `About ${formatMoney(inDisplay, "USD")} at the current rate`
                : "Set by the household rate; adjust it here"
            }
            label="Annual NZ Super"
            size="sm"
            value={annual}
            onChange={(v) => update({ nzSuperAnnual: v ?? 0 })}
          />
          <NumericCard
            allowDecimal={false}
            grouping={false}
            hint="Eligibility age"
            label="From age"
            size="sm"
            value={startAge}
            onChange={(v) => update({ nzSuperStartAge: v ?? 65 })}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-[14px] font-medium text-ink">KiwiSaver</h3>
          <p className="text-[13px] leading-relaxed text-ink-3">
            KiwiSaver keeps compounding but cannot be drawn before this age, so
            an earlier retirement has to be funded from accessible assets alone.
          </p>
          <NumericCard
            allowDecimal={false}
            grouping={false}
            hint="The NZ default is 65, matching NZ Super"
            label="Unlock age"
            size="sm"
            value={unlockAge}
            onChange={(v) => update({ kiwisaverUnlockAge: v ?? 65 })}
          />
        </div>
      </div>
    </Section>
  );
}
