import type {
  ContributionFrequency,
  Currency,
  IncomeSource,
  IncomeType,
} from "@/types";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Briefcase, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

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
import { FrequencyPills } from "@/components/ui/FrequencyPills";
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

export function IncomeEditor({ isOpen, onClose, source }: IncomeEditorProps) {
  const upsert = useIncome((s) => s.upsert);
  const remove = useIncome((s) => s.remove);
  const [form, setForm] = useState<FormState>(blank(source));
  const nameRef = useAutoFocus<HTMLInputElement>();

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
          {source ? (
            <Button
              className="bg-loss/10 text-loss"
              size="sm"
              startContent={<Trash2 className="h-3.5 w-3.5" />}
              variant="flat"
              onPress={handleDelete}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
          </div>
        </>
      }
      icon={Briefcase}
      isOpen={isOpen}
      subtitle={
        source
          ? "Update this income source"
          : "Enter gross pay — tax is calculated for you"
      }
      title={source ? "Edit income" : "Add income"}
      onClose={onClose}
    >
      <Input
        ref={nameRef}
        isRequired
        classNames={{
          inputWrapper:
            "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15 group-data-[focus=true]:border-accent/40 group-data-[focus=true]:bg-accent/[0.04]",
        }}
        label="Name"
        labelPlacement="outside"
        placeholder="e.g. Day job"
        value={form.name}
        variant="bordered"
        onValueChange={(v) => set("name", v)}
      />

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          Type
        </div>
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
      </div>

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
        value={form.amount}
        onChange={(v) => set("amount", v)}
      />

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          Paid {FREQUENCY_LABEL[form.frequency].toLowerCase()}
        </div>
        <FrequencyPills
          value={form.frequency}
          onChange={(v) => set("frequency", v)}
        />
      </div>

      {isSalary && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
            KiwiSaver
          </div>
          <div className="mb-1.5 text-[11px] text-ink-400">
            Your contribution rate
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KIWISAVER_EMPLOYEE_RATES.map((rate) => (
              <button
                key={rate}
                className={clsx(
                  "rounded-md border px-2.5 py-1 text-xs transition",
                  form.kiwisaverRate === rate
                    ? "border-accent/40 bg-accent/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                )}
                type="button"
                onClick={() => set("kiwisaverRate", rate)}
              >
                {formatPercent(rate, 0)}
              </button>
            ))}
            <button
              className={clsx(
                "rounded-md border px-2.5 py-1 text-xs transition",
                form.kiwisaverRate === null
                  ? "border-accent/40 bg-accent/10 text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
              )}
              type="button"
              onClick={() => set("kiwisaverRate", null)}
            >
              Not enrolled
            </button>
          </div>

          {form.kiwisaverRate !== null && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
              <span className="text-[11px] text-ink-400">
                Employer contribution
              </span>
              <div className="flex items-baseline gap-1">
                <input
                  className="w-14 bg-transparent text-right font-mono tabular text-sm font-semibold outline-none"
                  placeholder="3"
                  type="text"
                  {...employerField}
                />
                <span className="text-xs text-ink-400">%</span>
              </div>
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            Contributions are worked out from this salary, so you don&apos;t
            need to enter them on the KiwiSaver asset. Employer contributions
            are reduced by ESCT, and the government contribution is added where
            you qualify.
          </p>
        </div>
      )}

      <ToggleRow
        hint="Rental or royalties that keep paying — reduces what the portfolio has to cover"
        label="Continues in retirement"
        value={form.continuesInRetirement}
        onChange={(v) => set("continuesInRetirement", v)}
      />

      <Input
        classNames={{
          inputWrapper:
            "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15 group-data-[focus=true]:border-accent/40 group-data-[focus=true]:bg-accent/[0.04]",
        }}
        label="Notes"
        labelPlacement="outside"
        placeholder="Optional"
        value={form.notes}
        variant="bordered"
        onValueChange={(v) => set("notes", v)}
      />
    </DialogShell>
  );
}
