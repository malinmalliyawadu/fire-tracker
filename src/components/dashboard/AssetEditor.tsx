import type {
  Asset,
  AssetType,
  ContributionFrequency,
  Currency,
} from "@/types";

import { Button } from "@heroui/button";
import { Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ASSET_TYPES,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
  FREQUENCY_LABEL,
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

interface AssetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset;
}

interface FormState {
  name: string;
  type: AssetType;
  value: number | null;
  currency: Currency;
  contribution: number | null;
  frequency: ContributionFrequency;
  countsTowardFire: boolean;
  notes: string;
}

const blank = (asset?: Asset): FormState => ({
  name: asset?.name ?? "",
  type: asset?.type ?? "shares",
  value: asset?.value ?? null,
  currency: asset?.currency ?? "NZD",
  contribution: asset?.contribution ?? 0,
  frequency: asset?.frequency ?? "monthly",
  countsTowardFire: countsTowardFire(asset ?? {}),
  notes: asset?.notes ?? "",
});

export function AssetEditor({ isOpen, onClose, asset }: AssetEditorProps) {
  const upsertAsset = usePortfolio((s) => s.upsertAsset);
  const removeAsset = usePortfolio((s) => s.removeAsset);
  const [form, setForm] = useState<FormState>(blank(asset));
  const nameRef = useAutoFocus<HTMLInputElement>(isOpen);

  useEffect(() => {
    if (isOpen) setForm(blank(asset));
  }, [isOpen, asset]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    upsertAsset({
      id: asset?.id,
      name: form.name.trim(),
      type: form.type,
      value: form.value ?? 0,
      currency: form.currency,
      contribution: form.contribution ?? 0,
      frequency: form.frequency,
      countsTowardFire: form.countsTowardFire,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (asset) removeAsset(asset.id);
    onClose();
  };

  const monthlyContribution = toMonthly(form.contribution ?? 0, form.frequency);

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
            {asset ? "Save changes" : "Add asset"}
          </Button>
        </>
      }
      footerStart={
        asset && (
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
      icon={Wallet}
      isOpen={isOpen}
      subtitle={
        asset
          ? "Update this holding's details"
          : "Track an investment, savings, KiwiSaver or crypto"
      }
      title={asset ? "Edit asset" : "Add asset"}
      onClose={onClose}
    >
      <TextField
        required
        inputRef={nameRef}
        label="Name"
        placeholder="e.g. Simplicity Growth Fund"
        value={form.name}
        onChange={(v) => set("name", v)}
      />

      <Field label="Type">
        <TypeGrid<AssetType>
          cols={3}
          options={ASSET_TYPES.map((t) => ({
            value: t,
            label: ASSET_TYPE_LABEL[t],
            icon: ASSET_TYPE_ICON[t],
          }))}
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
        label="Current value"
        value={form.value}
        onChange={(v) => set("value", v)}
      />

      <div className="space-y-2">
        <NumericCard
          label="Contribution"
          meta={
            monthlyContribution > 0
              ? `≈ ${formatMoney(monthlyContribution, form.currency)}/mo`
              : "Optional"
          }
          prefix={currencySymbol(form.currency)}
          size="md"
          trailing={FREQUENCY_LABEL[form.frequency]}
          value={form.contribution}
          onChange={(v) => set("contribution", v)}
        />
        <FrequencyPills
          value={form.frequency}
          onChange={(v) => set("frequency", v)}
        />
      </div>

      <FireInclusionToggle
        excludedHint={
          form.type === "property"
            ? "A home you live in can't be drawn down"
            : "Held, but not to retire on"
        }
        includedHint="Part of the pot you'll retire on"
        value={form.countsTowardFire}
        onChange={(v) => set("countsTowardFire", v)}
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
