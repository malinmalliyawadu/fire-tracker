import type { Expense } from "@/types";

import { Pencil, Wallet } from "lucide-react";
import { Button } from "@heroui/button";
import { useState } from "react";

import { ExpenseEditor } from "./ExpenseEditor";

import {
  EXPENSE_CATEGORY_COLOR,
  EXPENSE_CATEGORY_LABEL,
} from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useExpenses } from "@/store/expenses";
import { usePlanBudget } from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";

export function ExpensesCard() {
  const expenses = useExpenses((s) => s.expenses);
  const settings = useSettings((s) => s.settings);
  const budget = usePlanBudget();
  const [editing, setEditing] = useState<Expense | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (expense: Expense) => {
    setEditing(expense);
    setOpen(true);
  };

  return (
    <Card
      action={
        <Button className="bg-accent text-white" size="sm" onPress={startAdd}>
          + Add expense
        </Button>
      }
      eyebrow="Outgoings"
      title="Expenses"
    >
      {expenses.length === 0 ? (
        <EmptyState
          action={
            <Button
              className="bg-accent text-white"
              size="sm"
              onPress={startAdd}
            >
              Add your first expense
            </Button>
          }
          description={`Right now your FIRE target is built from the single annual figure in settings (${formatMoney(settings.annualExpenses, display)}). Itemise and it will follow what you actually spend — including which costs stop or start at retirement.`}
          icon={Wallet}
          title="Using the settings figure"
        />
      ) : (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
                  <th className="pb-3 text-left font-medium">Name</th>
                  <th className="pb-3 text-left font-medium">Category</th>
                  <th className="pb-3 text-left font-medium">Applies</th>
                  <th className="pb-3 text-right font-medium">Per year</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const annual =
                    toMonthly(
                      convert(expense.amount, expense.currency, display, rate),
                      expense.frequency,
                    ) * 12;

                  return (
                    <tr
                      key={expense.id}
                      className="group border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3.5">
                        <div className="font-medium">{expense.name}</div>
                        {expense.notes && (
                          <div className="mt-0.5 text-xs text-ink-400">
                            {expense.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                EXPENSE_CATEGORY_COLOR[expense.category],
                            }}
                          />
                          {EXPENSE_CATEGORY_LABEL[expense.category]}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-ink-400">
                        {expense.startsAtRetirement
                          ? "From retirement"
                          : expense.stopsAtRetirement
                            ? "Until retirement"
                            : "Always"}
                      </td>
                      <td className="py-3.5 text-right">
                        <Money amount={annual} currency={display} />
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          aria-label={`Edit ${expense.name}`}
                          className="rounded-md p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                          onClick={() => startEdit(expense)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-3">
            <Figure
              hint="Drives your savings rate"
              label="Spending today"
              value={formatMoney(budget.annualExpenses, display)}
            />
            <Figure
              hint="Drives your FIRE target"
              label="In retirement"
              value={formatMoney(budget.retirementExpenses, display)}
            />
            <Figure
              hint={
                budget.workOnlyAnnual > 0 || budget.retirementOnlyAnnual > 0
                  ? `${formatMoney(budget.workOnlyAnnual, display)} stops · ${formatMoney(budget.retirementOnlyAnnual, display)} starts`
                  : "No costs change at retirement"
              }
              label="Change at retirement"
              value={formatMoney(
                budget.retirementExpenses - budget.annualExpenses,
                display,
              )}
            />
          </div>
        </div>
      )}

      <ExpenseEditor
        expense={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}

function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        {label}
      </div>
      <div className="mt-1 font-mono tabular text-lg font-semibold tracking-tight text-white">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-ink-500">{hint}</div>}
    </div>
  );
}
