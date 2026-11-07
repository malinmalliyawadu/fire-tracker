import type { Currency } from "@/types";

import { Flame } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

import { ageOn, todayIso } from "@/domain/age";
import { formatMoney, formatPercent } from "@/domain/format";
import {
  DEFAULT_EMPLOYER_KIWISAVER_RATE,
  KIWISAVER_EMPLOYEE_RATES,
} from "@/domain/tax";
import { useExpenses } from "@/store/expenses";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useSettings } from "@/store/settings";
import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DateCard } from "@/components/ui/DateCard";
import { DialogShell } from "@/components/ui/DialogShell";
import { Field } from "@/components/ui/Field";
import { OptionPills } from "@/components/ui/OptionPills";
import { SliderField } from "@/components/ui/SliderField";
import { Button } from "@/components/ui/Button";

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Draft {
  currency: Currency;
  /** YYYY-MM-DD. */
  birthDate: string;
  retirementAge: number;
  salary: number | null;
  kiwisaverRate: number;
  annualExpenses: number | null;
  kiwisaverBalance: number | null;
  investments: number | null;
}

const STEPS = ["You", "Income", "Spending", "What you have"] as const;

const RATE_OPTIONS = KIWISAVER_EMPLOYEE_RATES.map((rate) => ({
  value: rate,
  label: formatPercent(rate, 0),
}));

export function OnboardingDialog({ isOpen, onClose }: OnboardingDialogProps) {
  const settings = useSettings((s) => s.settings);
  const updateSettings = useSettings((s) => s.update);
  const upsertIncome = useIncome((s) => s.upsert);
  const upsertExpense = useExpenses((s) => s.upsertExpense);
  const upsertAsset = usePortfolio((s) => s.upsertAsset);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    currency: settings.displayCurrency,
    birthDate: settings.birthDate,
    retirementAge: settings.retirementAge,
    salary: null,
    kiwisaverRate: 0.03,
    annualExpenses: null,
    kiwisaverBalance: null,
    investments: null,
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const finish = () => {
    updateSettings({
      displayCurrency: draft.currency,
      birthDate: draft.birthDate,
      retirementAge: draft.retirementAge,
      annualExpenses: draft.annualExpenses ?? settings.annualExpenses,
      onboarded: true,
    });

    if (draft.salary && draft.salary > 0) {
      upsertIncome({
        name: "Salary",
        type: "salary",
        amount: draft.salary,
        currency: draft.currency,
        frequency: "annually",
        kiwisaverRate: draft.kiwisaverRate,
        employerKiwisaverRate: DEFAULT_EMPLOYER_KIWISAVER_RATE,
      });
    }

    if (draft.annualExpenses && draft.annualExpenses > 0) {
      upsertExpense({
        name: "Living costs",
        category: "other",
        amount: draft.annualExpenses,
        currency: draft.currency,
        frequency: "annually",
      });
    }

    if (draft.kiwisaverBalance && draft.kiwisaverBalance > 0) {
      upsertAsset({
        name: "KiwiSaver",
        type: "kiwisaver",
        value: draft.kiwisaverBalance,
        currency: draft.currency,
        contribution: 0,
        frequency: "monthly",
      });
    }

    if (draft.investments && draft.investments > 0) {
      upsertAsset({
        name: "Investments",
        type: "shares",
        value: draft.investments,
        currency: draft.currency,
        contribution: 0,
        frequency: "monthly",
      });
    }

    onClose();
  };

  const skip = () => {
    updateSettings({ onboarded: true });
    onClose();
  };

  const isLast = step === STEPS.length - 1;
  const age = ageOn(draft.birthDate);

  return (
    <DialogShell
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => (isLast ? finish() : setStep(step + 1))}
          >
            {isLast ? "Start tracking" : "Next"}
          </Button>
        </>
      }
      footerStart={
        <Button size="sm" variant="ghost" onClick={skip}>
          Skip setup
        </Button>
      }
      icon={Flame}
      isOpen={isOpen}
      subtitle="Four quick questions. Everything can be changed later, and nothing leaves your browser."
      title="Set up your plan"
      onClose={skip}
    >
      <div className="flex gap-1.5">
        {STEPS.map((label, index) => (
          <div key={label} className="min-w-0 flex-1">
            <div
              className={clsx(
                "h-[3px] rounded-full transition-colors duration-[var(--dur-hover)]",
                index <= step ? "bg-ink" : "bg-wash-strong",
              )}
            />
            <div
              className={clsx(
                "mt-2 truncate text-[12px] font-medium transition-colors duration-[var(--dur-hover)]",
                index === step ? "text-ink" : "text-ink-3",
              )}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <Field label="Currency">
            <CurrencyToggle
              value={draft.currency}
              onChange={(c) => set("currency", c)}
            />
          </Field>
          <DateCard
            hint="Every age in the plan is counted from it, so it never needs updating"
            label="Date of birth"
            max={todayIso()}
            meta={`Age ${age}`}
            value={draft.birthDate}
            onChange={(v) => set("birthDate", v)}
          />
          <SliderField
            display={`${draft.retirementAge}`}
            hint={`${Math.max(0, draft.retirementAge - age)} years away`}
            label="Target retirement age"
            max={80}
            min={Math.max(age + 1, 25)}
            step={1}
            value={draft.retirementAge}
            onChange={(v) => set("retirementAge", v)}
          />
        </>
      )}

      {step === 1 && (
        <>
          <AmountInput
            focusOnMount
            currency={draft.currency}
            hint="Gross, before tax. Tax and KiwiSaver are worked out for you."
            label="Annual salary"
            value={draft.salary}
            onChange={(v) => set("salary", v)}
          />
          <Field label="KiwiSaver contribution">
            <OptionPills
              options={RATE_OPTIONS}
              value={draft.kiwisaverRate}
              onChange={(v) => set("kiwisaverRate", v)}
            />
          </Field>
          <p className="text-[13px] leading-relaxed text-ink-3">
            Leave the salary blank if you&apos;d rather add income later. Your
            savings rate needs it to mean anything.
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <AmountInput
            focusOnMount
            currency={draft.currency}
            hint={
              draft.annualExpenses
                ? `${formatMoney(draft.annualExpenses / 12, draft.currency)} a month`
                : "Everything you spend in a year, excluding loan repayments"
            }
            label="Annual spending"
            value={draft.annualExpenses}
            onChange={(v) => set("annualExpenses", v)}
          />
          <p className="text-[13px] leading-relaxed text-ink-3">
            This sets your FIRE number — the 4% rule makes it 25× this figure.
            You can break it into categories on the Spending page afterwards,
            and mark which costs stop or start when you retire.
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <AmountInput
            focusOnMount
            currency={draft.currency}
            hint="Locked until 65, but it still compounds"
            label="KiwiSaver balance"
            value={draft.kiwisaverBalance}
            onChange={(v) => set("kiwisaverBalance", v)}
          />
          <AmountInput
            currency={draft.currency}
            hint="Shares, funds, savings — anything invested"
            label="Other investments"
            value={draft.investments}
            onChange={(v) => set("investments", v)}
          />
          <p className="text-[13px] leading-relaxed text-ink-3">
            Add property, crypto, and any loans from the Dashboard once
            you&apos;re in. Loans matter — they amortise properly here.
          </p>
        </>
      )}
    </DialogShell>
  );
}
