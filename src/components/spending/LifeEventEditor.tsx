import type { Currency, LifeEvent } from "@/types";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { CalendarClock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { formatMoney } from "@/domain/format";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useNumericField } from "@/hooks/useNumericField";
import { useExpenses } from "@/store/expenses";
import { useSettings } from "@/store/settings";
import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";

interface LifeEventEditorProps {
  isOpen: boolean;
  onClose: () => void;
  event?: LifeEvent;
}

interface FormState {
  name: string;
  year: number | null;
  amount: number | null;
  currency: Currency;
  direction: "cost" | "windfall";
  notes: string;
}

const blank = (event?: LifeEvent): FormState => ({
  name: event?.name ?? "",
  year: event?.year ?? new Date().getFullYear() + 1,
  amount: event ? Math.abs(event.amount) : null,
  currency: event?.currency ?? "NZD",
  direction: event && event.amount < 0 ? "windfall" : "cost",
  notes: event?.notes ?? "",
});

export function LifeEventEditor({
  isOpen,
  onClose,
  event,
}: LifeEventEditorProps) {
  const upsert = useExpenses((s) => s.upsertEvent);
  const remove = useExpenses((s) => s.removeEvent);
  const settings = useSettings((s) => s.settings);
  const [form, setForm] = useState<FormState>(blank(event));
  const nameRef = useAutoFocus<HTMLInputElement>();

  useEffect(() => {
    if (isOpen) setForm(blank(event));
  }, [isOpen, event]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const yearField = useNumericField({
    value: form.year,
    onChange: (v) => set("year", v),
    allowDecimal: false,
    grouping: false,
  });

  const handleSave = () => {
    if (!form.name.trim() || form.year === null) return;
    const magnitude = Math.abs(form.amount ?? 0);

    upsert({
      id: event?.id,
      name: form.name.trim(),
      year: form.year,
      amount: form.direction === "windfall" ? -magnitude : magnitude,
      currency: form.currency,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (event) remove(event.id);
    onClose();
  };

  const thisYear = new Date().getFullYear();
  const age =
    form.year !== null ? settings.currentAge + (form.year - thisYear) : null;

  return (
    <DialogShell
      footer={
        <>
          {event ? (
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
              isDisabled={!form.name.trim() || form.year === null}
              onPress={handleSave}
            >
              {event ? "Save changes" : "Add event"}
            </Button>
          </div>
        </>
      }
      icon={CalendarClock}
      isOpen={isOpen}
      subtitle="A one-off cost or windfall landing in a particular year"
      title={event ? "Edit event" : "Add life event"}
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
        placeholder="e.g. Replace the car"
        value={form.name}
        variant="bordered"
        onValueChange={(v) => set("name", v)}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { value: "cost", label: "Cost", hint: "Money going out" },
            { value: "windfall", label: "Windfall", hint: "Money coming in" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            className={clsx(
              "rounded-lg border px-3 py-2 text-left text-xs transition",
              form.direction === option.value
                ? "border-accent/40 bg-accent/10 text-white"
                : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
            )}
            type="button"
            onClick={() => set("direction", option.value)}
          >
            <div className="font-semibold">{option.label}</div>
            <div className="mt-0.5 text-[10px] text-ink-400">{option.hint}</div>
          </button>
        ))}
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
          form.amount
            ? `${form.direction === "windfall" ? "Adds" : "Takes"} ${formatMoney(Math.abs(form.amount), form.currency)} in ${form.year ?? "—"}`
            : undefined
        }
        label="Amount"
        tone={form.direction === "windfall" ? "accent" : "loss"}
        value={form.amount}
        onChange={(v) => set("amount", v)}
      />

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Year
          </span>
          <span className="text-[11px] text-ink-400">
            {age !== null && age >= 0 ? `You'll be ${age}` : "—"}
          </span>
        </div>
        <input
          className="w-full bg-transparent font-mono tabular text-2xl font-semibold tracking-tight outline-none placeholder:text-ink-600"
          placeholder={`${thisYear + 1}`}
          type="text"
          {...yearField}
        />
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
