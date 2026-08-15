import type {
  ContributionFrequency,
  Currency,
  Liability,
  LiabilityType,
} from "@/types";

import { Button } from "@heroui/button";
import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  FREQUENCY_LABEL,
  LIABILITY_TYPES,
  LIABILITY_TYPE_ICON,
  LIABILITY_TYPE_LABEL,
} from "@/domain/labels";
import { countsTowardFire } from "@/domain/fire";
import { formatMoney } from "@/domain/format";
import { toMonthly } from "@/domain/currency";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { usePortfolio } from "@/store/portfolio";
import { AmountInput, currencySymbol } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { Field } from "@/components/ui/Field";
import { FireInclusionToggle } from "@/components/ui/FireInclusionToggle";
import { FrequencyPills } from "@/components/ui/FrequencyPills";
import { NumericCard } from "@/components/ui/NumericCard";
import { TextField } from "@/components/ui/TextField";
import { TypeGrid } from "@/components/ui/TypeGrid";

interface LiabilityEditorProps {
  isOpen: boolean;
  onClose: () => void;
  liability?: Liability;
}

interface FormState {
  name: string;
  type: LiabilityType;
  balance: number | null;
  currency: Currency;
  interestRate: number | null;
  payment: number | null;
  frequency: ContributionFrequency;
  countsTowardFire: boolean;
}

const blank = (l?: Liability): FormState => ({
  name: l?.name ?? "",
  type: l?.type ?? "mortgage",
  balance: l?.balance ?? null,
  currency: l?.currency ?? "NZD",
  // toFixed keeps 0.0725 from surfacing as 7.249999999999999
  interestRate:
    l?.interestRate !== undefined
      ? Number((l.interestRate * 100).toFixed(4))
      : 5,
  payment: l?.payment ?? 0,
  frequency: l?.frequency ?? "monthly",
  countsTowardFire: countsTowardFire(l ?? {}),
});

export function LiabilityEditor({
  isOpen,
  onClose,
  liability,
}: LiabilityEditorProps) {
  const upsertLiability = usePortfolio((s) => s.upsertLiability);
  const removeLiability = usePortfolio((s) => s.removeLiability);
  const [form, setForm] = useState<FormState>(blank(liability));
  const nameRef = useAutoFocus<HTMLInputElement>(isOpen);

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
      balance: form.balance ?? 0,
      currency: form.currency,
      interestRate: (form.interestRate ?? 0) / 100,
      payment: form.payment ?? 0,
      frequency: form.frequency,
      countsTowardFire: form.countsTowardFire,
    });
    onClose();
  };

  const handleDelete = () => {
    if (liability) removeLiability(liability.id);
    onClose();
  };

  const monthlyPayment = toMonthly(form.payment ?? 0, form.frequency);

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
            {liability ? "Save changes" : "Add liability"}
          </Button>
        </>
      }
      footerStart={
        liability && (
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
      <TextField
        required
        inputRef={nameRef}
        label="Name"
        placeholder="e.g. ANZ Mortgage"
        tone="loss"
        value={form.name}
        onChange={(v) => set("name", v)}
      />

      <Field label="Type">
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
      </Field>

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

      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <NumericCard
            grouping={false}
            label="Interest rate"
            placeholder="5"
            size="md"
            tone="loss"
            unit="%"
            value={form.interestRate}
            onChange={(v) => set("interestRate", v)}
          />
          <NumericCard
            label="Payment"
            meta={
              monthlyPayment > 0
                ? `≈ ${formatMoney(monthlyPayment, form.currency)}/mo`
                : FREQUENCY_LABEL[form.frequency]
            }
            prefix={currencySymbol(form.currency)}
            size="md"
            tone="loss"
            value={form.payment}
            onChange={(v) => set("payment", v)}
          />
        </div>
        <FrequencyPills
          tone="loss"
          value={form.frequency}
          onChange={(v) => set("frequency", v)}
        />
      </div>

      {/* Both are serviced in retirement — only the balance differs. */}
      <FireInclusionToggle
        excludedHint="Repaid by the asset behind it"
        includedHint="Balance subtracted from the pot"
        tone="loss"
        value={form.countsTowardFire}
        onChange={(v) => set("countsTowardFire", v)}
      />
    </DialogShell>
  );
}
