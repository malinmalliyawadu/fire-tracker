import type { Expense } from "@/types";

import { Plus, Wallet } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Figure, FigureRow } from "@/components/ui/Figure";
import {
  Cell,
  Ledger,
  LedgerHead,
  LedgerRow,
  OpenCell,
  Td,
  Th,
} from "@/components/ui/Ledger";
import { Money } from "@/components/ui/Money";
import { Section } from "@/components/ui/Section";

const whenLabel = (expense: Expense): string => {
  if (expense.startsAtRetirement) return "From retirement";
  if (expense.stopsAtRetirement) return "Until retirement";

  return "Always";
};

export function SpendingSection() {
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

  const change = budget.retirementExpenses - budget.annualExpenses;

  return (
    <Section
      aside={
        <Button icon={Plus} size="sm" variant="primary" onClick={startAdd}>
          Add expense
        </Button>
      }
      lede="What you spend sets the FIRE target. Mark the costs that stop or start when you retire."
      title="Spending"
    >
      {expenses.length === 0 ? (
        <EmptyState
          action={
            <Button size="sm" variant="primary" onClick={startAdd}>
              Add your first expense
            </Button>
          }
          description={`Right now the FIRE target is built from the single annual figure in settings, ${formatMoney(settings.annualExpenses, display)}. Itemise and it follows what you actually spend, including which costs stop or start at retirement.`}
          icon={Wallet}
          title="Using the settings figure"
        />
      ) : (
        <div className="space-y-6">
          <Ledger>
            <LedgerHead>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>When</Th>
              <Th align="right" className="w-32">
                A year
              </Th>
              <Th aria-label="Open" className="w-6" />
            </LedgerHead>
            <tbody>
              {expenses.map((expense) => {
                const annual =
                  toMonthly(
                    convert(expense.amount, expense.currency, display, rate),
                    expense.frequency,
                  ) * 12;

                return (
                  <LedgerRow
                    key={expense.id}
                    label={`Edit ${expense.name}`}
                    onOpen={() => startEdit(expense)}
                  >
                    <Td>
                      <Cell primary={expense.name} secondary={expense.notes} />
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2 text-ink-2">
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              EXPENSE_CATEGORY_COLOR[expense.category],
                          }}
                        />
                        {EXPENSE_CATEGORY_LABEL[expense.category]}
                      </span>
                    </Td>
                    <Td className="text-ink-3">{whenLabel(expense)}</Td>
                    <Td num align="right">
                      <Money amount={annual} currency={display} />
                    </Td>
                    <OpenCell />
                  </LedgerRow>
                );
              })}
            </tbody>
          </Ledger>

          <FigureRow cols={3}>
            <Figure
              hint="Drives your savings rate"
              label="Spending today"
              size="sm"
              value={formatMoney(budget.annualExpenses, display)}
            />
            <Figure
              hint="Drives your FIRE target"
              label="In retirement"
              size="sm"
              value={formatMoney(budget.retirementExpenses, display)}
            />
            <Figure
              hint={
                budget.workOnlyAnnual > 0 || budget.retirementOnlyAnnual > 0
                  ? `${formatMoney(budget.workOnlyAnnual, display)} stops, ${formatMoney(budget.retirementOnlyAnnual, display)} starts`
                  : "No costs change at retirement"
              }
              label="Change at retirement"
              size="sm"
              value={<Money signed amount={change} currency={display} />}
            />
          </FigureRow>
        </div>
      )}

      <ExpenseEditor
        expense={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Section>
  );
}
