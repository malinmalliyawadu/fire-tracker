import type {
  ContributionFrequency,
  Currency,
  IncomeSource,
  IncomeType,
} from "@/types";

import { Button } from "@heroui/button";
import { Briefcase, Repeat, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  FREQUENCY_LABEL,
  INCOME_TYPES,
  INCOME_TYPE_ICON,
  INCOME_TYPE_LABEL,
} from "@/domain/labels";
import { formatMoney, formatPercent } from "@/domain/format";
import { toMonthly } from "@/domain/currency";
import {
  DEFAULT_EMPLOYER_KIWISAVER_RATE,
  KIWISAVER_EMPLOYEE_RATES,
} from "@/domain/tax";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useNumericField } from "@/hooks/useNumericField";
import { useIncome } from "@/store/income";
import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { Field, FieldLabel } from "@/components/ui/Field";
import { FrequencyPills } from "@/components/ui/FrequencyPills";
import { OptionPills } from "@/components/ui/OptionPills";
import { TextField } from "@/components/ui/TextField";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { TypeGrid } from "@/components/ui/TypeGrid";

interface IncomeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  source?: IncomeSource;
}

interface FormState {
  name: string;
  type: IncomeType;
  amount: number | null;
  currency: Currency;
  frequency: ContributionFrequency;
  kiwisaverRate: number | null;
  employerKiwisaverRate: number | null;
  continuesInRetirement: boolean;
  notes: string;
}

const blank = (source?: IncomeSource): FormState => ({
  name: source?.name ?? "",
  type: source?.type ?? "salary",
  amount: source?.amount ?? null,
  currency: source?.currency ?? "NZD",
  frequency: source?.frequency ?? "annually",
  kiwisaverRate: source?.kiwisaverRate ?? 0.03,
  employerKiwisaverRate:
    source?.employerKiwisaverRate ?? DEFAULT_EMPLOYER_KIWISAVER_RATE,
  continuesInRetirement: source?.continuesInRetirement ?? false,
  notes: source?.notes ?? "",
});

const RATE_OPTIONS: ReadonlyArray<{ value: number | null; label: string }> = [
  ...KIWISAVER_EMPLOYEE_RATES.map((rate) => ({
    value: rate as number | null,
    label: formatPercent(rate, 0),
  })),
  { value: null, label: "Not enrolled" },
];

export function IncomeEditor({ isOpen, onClose, source }: IncomeEditorProps) {
  const upsert = useIncome((s) => s.upsert);
  const remove = useIncome((s) => s.remove);
  const [form, setForm] = useState<FormState>(blank(source));
  const nameRef = useAutoFocus<HTMLInputElement>(isOpen);

  useEffect(() => {
    if (isOpen) setForm(blank(source));
  }, [isOpen, source]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const employerField = useNumericField({
    value:
      form.employerKiwisaverRate === null
        ? null
        : Number((form.employerKiwisaverRate * 100).toFixed(2)),
    onChange: (v) => set("employerKiwisaverRate", v === null ? null : v / 100),
  });

  const isSalary = form.type === "salary";

  const handleSave = () => {
    if (!form.name.trim()) return;
    upsert({
      id: source?.id,
      name: form.name.trim(),
      type: form.type,
      amount: form.amount ?? 0,
      currency: form.currency,
      frequency: form.frequency,
      kiwisaverRate: isSalary ? (form.kiwisaverRate ?? undefined) : undefined,
      employerKiwisaverRate: isSalary
        ? (form.employerKiwisaverRate ?? undefined)
        : undefined,
      continuesInRetirement: form.continuesInRetirement,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (source) remove(source.id);
    onClose();
  };

  const annual = toMonthly(form.amount ?? 0, form.frequency) * 12;

  return (
    <DialogShell
      footer={
        <>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-br from-accent to-accent-deep text-white shadow-[0_8px_24px_-8px_rgba(124,131,231,0.6)]"
            isDisabled={!form.name.trim()}
            onPress={handleSave}
          >
            {source ? "Save changes" : "Add income"}
          </Button>
        </>
      }
      footerStart={
        source && (
          <Button
            className="bg-loss/10 text-loss"
            size="sm"
            startContent={<Trash2 className="h-3.5 w-3.5" />}
            variant="flat"
            onPress={handleDelete}
          >
            Delete
          </Button>
        )
      }
      icon={Briefcase}
      isOpen={isOpen}
      subtitle={
        source
          ? "Update this income source"
          : "Enter gross pay - tax is calculated for you"
      }
      title={source ? "Edit income" : "Add income"}
      onClose={onClose}
    >
      <TextField
        required
        inputRef={nameRef}
        label="Name"
        placeholder="e.g. Day job"
        value={form.name}
        onChange={(v) => set("name", v)}
      />

      <Field label="Type">
        <TypeGrid<IncomeType>
          cols={4}
          options={INCOME_TYPES.map((t) => ({
            value: t,
            label: INCOME_TYPE_LABEL[t],
            icon: INCOME_TYPE_ICON[t],
          }))}
          value={form.type}
          onChange={(v) => set("type", v)}
        />
      </Field>

      <div className="space-y-2">
        <AmountInput
          action={
            <CurrencyToggle
              value={form.currency}
              onChange={(c) => set("currency", c)}
            />
          }
          currency={form.currency}
          hint={
            annual > 0
              ? `${formatMoney(annual, form.currency)} per year, before tax`
              : "Gross, before tax"
          }
          label="Gross amount"
          trailing={FREQUENCY_LABEL[form.frequency]}
          value={form.amount}
          onChange={(v) => set("amount", v)}
        />
        <FrequencyPills
          value={form.frequency}
          onChange={(v) => set("frequency", v)}
        />
      </div>

      {isSalary && (
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <Field label="KiwiSaver" meta="Your contribution">
            <OptionPills
              options={RATE_OPTIONS}
              value={form.kiwisaverRate}
              onChange={(v) => set("kiwisaverRate", v)}
            />
          </Field>

          {form.kiwisaverRate !== null && (
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <FieldLabel>Employer contribution</FieldLabel>
              <div className="flex items-baseline gap-1">
                <input
                  aria-label="Employer contribution rate"
                  className="w-10 bg-transparent text-right font-mono tabular text-sm font-semibold outline-none focus-visible:outline-none"
                  placeholder="3"
                  type="text"
                  {...employerField}
                />
                <span className="font-mono text-sm text-ink-400">%</span>
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-ink-500">
            Contributions are worked out from this salary, so you don&apos;t
            need to enter them on the KiwiSaver asset. Employer contributions
            are reduced by ESCT, and the government contribution is added where
            you qualify.
          </p>
        </div>
      )}

      <ToggleRow
        hint="Rental or royalties that keep paying, reducing what the portfolio has to cover"
        icon={Repeat}
        label="Continues in retirement"
        value={form.continuesInRetirement}
        onChange={(v) => set("continuesInRetirement", v)}
      />

      <TextField
        label="Notes"
        placeholder="Optional"
        value={form.notes}
        onChange={(v) => set("notes", v)}
      />
    </DialogShell>
  );
}
