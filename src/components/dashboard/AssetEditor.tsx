import type {
  Asset,
  AssetType,
  ContributionFrequency,
  Currency,
} from "@/types";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ASSET_TYPES,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
  FREQUENCY_LABEL,
} from "@/domain/labels";
import { formatMoney } from "@/domain/format";
import { toMonthly } from "@/domain/currency";
import { usePortfolio } from "@/store/portfolio";

import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { FrequencyPills } from "@/components/ui/FrequencyPills";
import { TypeGrid } from "@/components/ui/TypeGrid";

interface AssetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset;
}

interface FormState {
  name: string;
  type: AssetType;
  value: string;
  currency: Currency;
  contribution: string;
  frequency: ContributionFrequency;
  notes: string;
}

const blank = (asset?: Asset): FormState => ({
  name: asset?.name ?? "",
  type: asset?.type ?? "shares",
  value: asset?.value?.toString() ?? "",
  currency: asset?.currency ?? "NZD",
  contribution: asset?.contribution?.toString() ?? "0",
  frequency: asset?.frequency ?? "monthly",
  notes: asset?.notes ?? "",
});

export function AssetEditor({ isOpen, onClose, asset }: AssetEditorProps) {
  const upsertAsset = usePortfolio((s) => s.upsertAsset);
  const removeAsset = usePortfolio((s) => s.removeAsset);
  const [form, setForm] = useState<FormState>(blank(asset));

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
      value: parseFloat(form.value) || 0,
      currency: form.currency,
      contribution: parseFloat(form.contribution) || 0,
      frequency: form.frequency,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (asset) removeAsset(asset.id);
    onClose();
  };

  const monthlyContribution = toMonthly(
    parseFloat(form.contribution) || 0,
    form.frequency,
  );

  return (
    <DialogShell
      footer={
        <>
          {asset ? (
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
              {asset ? "Save changes" : "Add asset"}
            </Button>
          </div>
        </>
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
      <Input
        autoFocus
        classNames={{
          inputWrapper:
            "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15 group-data-[focus=true]:border-accent/40 group-data-[focus=true]:bg-accent/[0.04]",
        }}
        isRequired
        label="Name"
        labelPlacement="outside"
        placeholder="e.g. Simplicity Growth Fund"
        value={form.name}
        variant="bordered"
        onValueChange={(v) => set("name", v)}
      />

      <FieldSection label="Type">
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
      </FieldSection>

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

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Contribution
          </span>
          <span className="font-mono tabular text-[11px] text-ink-400">
            {monthlyContribution > 0
              ? `≈ ${formatMoney(monthlyContribution, form.currency)}/mo`
              : "Optional"}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base font-medium text-ink-400">
            {form.currency === "NZD" ? "NZ$" : "US$"}
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent font-mono tabular text-2xl font-semibold tracking-tight outline-none placeholder:text-ink-600"
            inputMode="decimal"
            placeholder="0"
            type="text"
            value={form.contribution}
            onChange={(e) => set("contribution", e.target.value)}
          />
          <span className="text-[11px] text-ink-500">
            {FREQUENCY_LABEL[form.frequency]}
          </span>
        </div>
        <div className="mt-3">
          <FrequencyPills
            value={form.frequency}
            onChange={(v) => set("frequency", v)}
          />
        </div>
      </div>

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
