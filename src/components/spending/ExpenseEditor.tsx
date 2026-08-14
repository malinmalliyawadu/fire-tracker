import type {
  ContributionFrequency,
  Currency,
  Expense,
  ExpenseCategory,
} from "@/types";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_ICON,
  EXPENSE_CATEGORY_LABEL,
  FREQUENCY_LABEL,
} from "@/domain/labels";
import { formatMoney } from "@/domain/format";
import { toMonthly } from "@/domain/currency";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useExpenses } from "@/store/expenses";
import { AmountInput } from "@/components/ui/AmountInput";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { DialogShell } from "@/components/ui/DialogShell";
import { FrequencyPills } from "@/components/ui/FrequencyPills";
import { TypeGrid } from "@/components/ui/TypeGrid";

interface ExpenseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
}

interface FormState {
  name: string;
  category: ExpenseCategory;
  amount: number | null;
  currency: Currency;
  frequency: ContributionFrequency;
  phase: "always" | "workOnly" | "retirementOnly";
  notes: string;
}

const phaseOf = (expense?: Expense): FormState["phase"] => {
  if (expense?.startsAtRetirement) return "retirementOnly";
  if (expense?.stopsAtRetirement) return "workOnly";

  return "always";
};

const blank = (expense?: Expense): FormState => ({
  name: expense?.name ?? "",
  category: expense?.category ?? "housing",
  amount: expense?.amount ?? null,
  currency: expense?.currency ?? "NZD",
  frequency: expense?.frequency ?? "monthly",
  phase: phaseOf(expense),
  notes: expense?.notes ?? "",
});

const PHASES: ReadonlyArray<{
  value: FormState["phase"];
  label: string;
  hint: string;
}> = [
  { value: "always", label: "Always", hint: "Before and after retiring" },
  {
    value: "workOnly",
    label: "Until retirement",
    hint: "Commuting, work gear",
  },
  {
    value: "retirementOnly",
    label: "From retirement",
    hint: "Travel, health cover",
  },
];

export function ExpenseEditor({
  isOpen,
  onClose,
  expense,
}: ExpenseEditorProps) {
  const upsert = useExpenses((s) => s.upsertExpense);
  const remove = useExpenses((s) => s.removeExpense);
  const [form, setForm] = useState<FormState>(blank(expense));
  const nameRef = useAutoFocus<HTMLInputElement>();

  useEffect(() => {
    if (isOpen) setForm(blank(expense));
  }, [isOpen, expense]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    upsert({
      id: expense?.id,
      name: form.name.trim(),
      category: form.category,
      amount: form.amount ?? 0,
      currency: form.currency,
      frequency: form.frequency,
      stopsAtRetirement: form.phase === "workOnly",
      startsAtRetirement: form.phase === "retirementOnly",
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (expense) remove(expense.id);
    onClose();
  };

  const monthly = toMonthly(form.amount ?? 0, form.frequency);

  return (
    <DialogShell
      footer={
        <>
          {expense ? (
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
              {expense ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </>
      }
      icon={Wallet}
      isOpen={isOpen}
      subtitle={
        expense
          ? "Update this expense"
          : "Itemised expenses replace the single annual figure in settings"
      }
      title={expense ? "Edit expense" : "Add expense"}
      tone="loss"
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
        placeholder="e.g. Groceries"
        value={form.name}
        variant="bordered"
        onValueChange={(v) => set("name", v)}
      />

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          Category
        </div>
        <TypeGrid<ExpenseCategory>
          cols={4}
          options={EXPENSE_CATEGORIES.map((c) => ({
            value: c,
            label: EXPENSE_CATEGORY_LABEL[c],
            icon: EXPENSE_CATEGORY_ICON[c],
          }))}
          value={form.category}
          onChange={(v) => set("category", v)}
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
          monthly > 0
            ? `≈ ${formatMoney(monthly * 12, form.currency)} per year`
            : FREQUENCY_LABEL[form.frequency]
        }
        label="Amount"
        tone="loss"
        value={form.amount}
        onChange={(v) => set("amount", v)}
      />

      <FrequencyPills
        value={form.frequency}
        onChange={(v) => set("frequency", v)}
      />

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          When it applies
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PHASES.map((phase) => (
            <button
              key={phase.value}
              className={clsx(
                "rounded-lg border px-3 py-2 text-left text-xs transition",
                form.phase === phase.value
                  ? "border-accent/40 bg-accent/10 text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
              )}
              type="button"
              onClick={() => set("phase", phase.value)}
            >
              <div className="font-semibold">{phase.label}</div>
              <div className="mt-0.5 text-[10px] text-ink-400">
                {phase.hint}
              </div>
            </button>
          ))}
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
