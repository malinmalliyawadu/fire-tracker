import type {
  ContributionFrequency,
  Currency,
  IncomeSource,
  IncomeType,
} from "@/types";

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
import { Button } from "@/components/ui/Button";
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.name.trim()}
            variant="primary"
            onClick={handleSave}
          >
            {source ? "Save changes" : "Add income"}
          </Button>
        </>
      }
      footerStart={
        source && (
          <Button
            icon={Trash2}
            size="sm"
            variant="danger"
            onClick={handleDelete}
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
          : "Enter gross pay. Tax is worked out for you"
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
        <div className="space-y-4 rounded-xl border border-line-soft bg-wash p-4">
          <Field label="KiwiSaver" meta="Your contribution">
            <OptionPills
              options={RATE_OPTIONS}
              value={form.kiwisaverRate}
              onChange={(v) => set("kiwisaverRate", v)}
            />
          </Field>

          {form.kiwisaverRate !== null && (
            <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
              <FieldLabel>Employer contribution</FieldLabel>
              <div className="flex items-baseline gap-1">
                <input
                  aria-label="Employer contribution rate"
                  className="num w-10 bg-transparent text-right text-[15px] font-medium text-ink outline-none focus-visible:outline-none"
                  placeholder="3"
                  type="text"
                  {...employerField}
                />
                <span className="text-[14px] text-ink-3">%</span>
              </div>
            </div>
          )}

          <p className="text-[12.5px] leading-relaxed text-ink-3">
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
