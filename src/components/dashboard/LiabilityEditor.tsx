import type {
  ContributionFrequency,
  Currency,
  Liability,
  LiabilityType,
} from "@/types";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  FREQUENCY_LABEL,
  LIABILITY_TYPES,
  LIABILITY_TYPE_ICON,
  LIABILITY_TYPE_LABEL,
} from "@/domain/labels";
import { formatMoney } from "@/domain/format";
import { toMonthly } from "@/domain/currency";
import { usePortfolio } from "@/store/portfolio";

import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { FrequencyPills } from "@/components/ui/FrequencyPills";
import { TypeGrid } from "@/components/ui/TypeGrid";

interface LiabilityEditorProps {
  isOpen: boolean;
  onClose: () => void;
  liability?: Liability;
}

interface FormState {
  name: string;
  type: LiabilityType;
  balance: string;
  currency: Currency;
  interestRate: string;
  payment: string;
  frequency: ContributionFrequency;
}

const blank = (l?: Liability): FormState => ({
  name: l?.name ?? "",
  type: l?.type ?? "mortgage",
  balance: l?.balance?.toString() ?? "",
  currency: l?.currency ?? "NZD",
  interestRate:
    l?.interestRate !== undefined ? (l.interestRate * 100).toString() : "5",
  payment: l?.payment?.toString() ?? "0",
  frequency: l?.frequency ?? "monthly",
});

export function LiabilityEditor({
  isOpen,
  onClose,
  liability,
}: LiabilityEditorProps) {
  const upsertLiability = usePortfolio((s) => s.upsertLiability);
  const removeLiability = usePortfolio((s) => s.removeLiability);
  const [form, setForm] = useState<FormState>(blank(liability));

  useEffect(() => {
    if (isOpen) setForm(blank(liability));
  }, [isOpen, liability]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    upsertLiability({
      id: liability?.id,
      name: form.name.trim(),
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency,
      interestRate: (parseFloat(form.interestRate) || 0) / 100,
      payment: parseFloat(form.payment) || 0,
      frequency: form.frequency,
    });
    onClose();
  };

  const handleDelete = () => {
    if (liability) removeLiability(liability.id);
    onClose();
  };

  const monthlyPayment = toMonthly(
    parseFloat(form.payment) || 0,
    form.frequency,
  );

  return (
    <DialogShell
      footer={
        <>
          {liability ? (
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
              {liability ? "Save changes" : "Add liability"}
            </Button>
          </div>
        </>
      }
      icon={CreditCard}
      isOpen={isOpen}
      subtitle={
        liability
          ? "Update this debt's details"
          : "Track a mortgage, loan, or credit card"
      }
      title={liability ? "Edit liability" : "Add liability"}
      tone="loss"
      onClose={onClose}
    >
      <Input
        autoFocus
        classNames={{
          inputWrapper:
            "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15 group-data-[focus=true]:border-loss/40 group-data-[focus=true]:bg-loss/[0.04]",
        }}
        isRequired
        label="Name"
        labelPlacement="outside"
        placeholder="e.g. ANZ Mortgage"
        value={form.name}
        variant="bordered"
        onValueChange={(v) => set("name", v)}
      />

      <FieldSection label="Type">
        <TypeGrid<LiabilityType>
          cols={3}
          options={LIABILITY_TYPES.map((t) => ({
            value: t,
            label: LIABILITY_TYPE_LABEL[t],
            icon: LIABILITY_TYPE_ICON[t],
          }))}
          tone="loss"
          value={form.type}
          onChange={(v) => set("type", v)}
        />
      </FieldSection>

      <AmountInput
        action={
          <CurrencyToggle
            value={form.currency}
            onChange={(c) => set("currency", c)}
          />
        }
        currency={form.currency}
        label="Outstanding balance"
        tone="loss"
        value={form.balance}
        onChange={(v) => set("balance", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <RatePill
          label="Interest rate"
          unit="%"
          value={form.interestRate}
          onChange={(v) => set("interestRate", v)}
        />
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Payment
            </span>
            <span className="font-mono tabular text-[11px] text-ink-400">
              {monthlyPayment > 0
                ? `≈ ${formatMoney(monthlyPayment, form.currency)}/mo`
                : ""}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-medium text-ink-400">
              {form.currency === "NZD" ? "NZ$" : "US$"}
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent font-mono tabular text-xl font-semibold tracking-tight outline-none placeholder:text-ink-600"
              inputMode="decimal"
              placeholder="0"
              type="text"
              value={form.payment}
              onChange={(e) => set("payment", e.target.value)}
            />
          </div>
        </div>
      </div>

      <FieldSection label={`Frequency · ${FREQUENCY_LABEL[form.frequency]}`}>
        <FrequencyPills
          value={form.frequency}
          onChange={(v) => set("frequency", v)}
        />
      </FieldSection>
    </DialogShell>
  );
}

interface RatePillProps {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
}

function RatePill({ label, value, unit, onChange }: RatePillProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <input
          className="min-w-0 flex-1 bg-transparent font-mono tabular text-xl font-semibold tracking-tight outline-none placeholder:text-ink-600"
          inputMode="decimal"
          placeholder="5"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="font-mono text-sm font-medium text-ink-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

function FieldSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        {label}
      </div>
      {children}
    </div>
  );
}
