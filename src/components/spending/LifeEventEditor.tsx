import type { Currency, LifeEvent } from "@/types";

import { Button } from "@heroui/button";
import { CalendarClock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMoney } from "@/domain/format";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useExpenses } from "@/store/expenses";
import { useSettings } from "@/store/settings";
import { AmountInput } from "@/components/ui/AmountInput";
import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { Field } from "@/components/ui/Field";
import { NumericCard } from "@/components/ui/NumericCard";
import { TextField } from "@/components/ui/TextField";

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

const DIRECTIONS = [
  { value: "cost", label: "Cost", hint: "Money going out" },
  { value: "windfall", label: "Windfall", hint: "Money coming in" },
] as const satisfies ReadonlyArray<{
  value: FormState["direction"];
  label: string;
  hint: string;
}>;

export function LifeEventEditor({
  isOpen,
  onClose,
  event,
}: LifeEventEditorProps) {
  const upsert = useExpenses((s) => s.upsertEvent);
  const remove = useExpenses((s) => s.removeEvent);
  const settings = useSettings((s) => s.settings);
  const [form, setForm] = useState<FormState>(blank(event));
  const nameRef = useAutoFocus<HTMLInputElement>(isOpen);

  useEffect(() => {
    if (isOpen) setForm(blank(event));
  }, [isOpen, event]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
  const tone = form.direction === "windfall" ? "accent" : "loss";

  return (
    <DialogShell
      footer={
        <>
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
        </>
      }
      footerStart={
        event && (
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
      icon={CalendarClock}
      isOpen={isOpen}
      subtitle="A one-off cost or windfall landing in a particular year"
      title={event ? "Edit event" : "Add life event"}
      onClose={onClose}
    >
      <TextField
        required
        inputRef={nameRef}
        label="Name"
        placeholder="e.g. Replace the car"
        value={form.name}
        onChange={(v) => set("name", v)}
      />

      <Field label="Direction">
        <ChoiceCards
          options={DIRECTIONS}
          tone={tone}
          value={form.direction}
          onChange={(v) => set("direction", v)}
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
        hint={
          form.amount
            ? `${form.direction === "windfall" ? "Adds" : "Takes"} ${formatMoney(Math.abs(form.amount), form.currency)} in ${form.year ?? "—"}`
            : undefined
        }
        label="Amount"
        tone={tone}
        value={form.amount}
        onChange={(v) => set("amount", v)}
      />

      <NumericCard
        allowDecimal={false}
        grouping={false}
        label="Year"
        meta={age !== null && age >= 0 ? `You'll be ${age}` : undefined}
        placeholder={`${thisYear + 1}`}
        size="md"
        value={form.year}
        onChange={(v) => set("year", v)}
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
