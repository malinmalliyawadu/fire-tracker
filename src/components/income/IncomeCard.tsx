import type { IncomeSource } from "@/types";

import { Briefcase, Pencil } from "lucide-react";
import { Button } from "@heroui/button";
import { useState } from "react";

import { IncomeEditor } from "./IncomeEditor";

import { FREQUENCY_SHORT, INCOME_TYPE_LABEL } from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { formatMoney, formatPercent } from "@/domain/format";
import { TAX_YEAR } from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { useIncome } from "@/store/income";
import {
  useIncomeTotals,
  usePlanBudget,
  useSavingsSummary,
} from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";

export function IncomeCard() {
  const sources = useIncome((s) => s.sources);
  const settings = useSettings((s) => s.settings);
  const totals = useIncomeTotals();
  const savings = useSavingsSummary();
  const budget = usePlanBudget();
  const [editing, setEditing] = useState<IncomeSource | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (source: IncomeSource) => {
    setEditing(source);
    setOpen(true);
  };

  return (
    <Card
      action={
        <Button className="bg-accent text-white" size="sm" onPress={startAdd}>
          + Add income
        </Button>
      }
      eyebrow="Earnings"
      title="Income"
    >
      {sources.length === 0 ? (
        <EmptyState
          action={
            <Button
              className="bg-accent text-white"
              size="sm"
              onPress={startAdd}
            >
              Add your income
            </Button>
          }
          description="Your savings rate is the strongest predictor of when you reach FIRE — and it needs income to mean anything."
          icon={Briefcase}
          title="No income yet"
        />
      ) : (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
                  <th className="pb-3 text-left font-medium">Source</th>
                  <th className="pb-3 text-left font-medium">Type</th>
                  <th className="pb-3 text-right font-medium">Gross / yr</th>
                  <th className="pb-3 text-right font-medium">KiwiSaver</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const annual =
                    toMonthly(
                      convert(source.amount, source.currency, display, rate),
                      source.frequency,
                    ) * 12;

                  return (
                    <tr
                      key={source.id}
                      className="group border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3.5">
                        <div className="font-medium">{source.name}</div>
                        {source.continuesInRetirement && (
                          <div className="mt-0.5 text-xs text-gain">
                            Continues in retirement
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-ink-300">
                          {INCOME_TYPE_LABEL[source.type]}
                          {source.currency === "USD" && (
                            <span className="text-[10px] text-accent">USD</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Money amount={annual} currency={display} />
                        <span className="ml-1 text-xs text-ink-400">
                          {FREQUENCY_SHORT.annually}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-ink-200">
                        {source.kiwisaverRate != null ? (
                          formatPercent(source.kiwisaverRate, 0)
                        ) : (
                          <span className="text-ink-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          aria-label={`Edit ${source.name}`}
                          className="rounded-md p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                          onClick={() => startEdit(source)}
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

          <div className="grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <Figure
              label="Gross income"
              value={formatMoney(totals.grossAnnual, display)}
            />
            <Figure
              hint={`Tax + ACC · ${TAX_YEAR}`}
              label="Tax"
              tone="loss"
              value={`-${formatMoney(totals.annualTax, display)}`}
            />
            <Figure
              label="Take-home"
              tone="gain"
              value={formatMoney(totals.takeHomeAnnual, display)}
            />
            <Figure
              hint={
                totals.kiwisaverAnnual > 0
                  ? `You ${formatMoney(totals.employeeKiwisaverAnnual, display)} · employer ${formatMoney(totals.employerKiwisaverAnnual, display)} · govt ${formatMoney(totals.govtContributionAnnual, display)}`
                  : undefined
              }
              label="KiwiSaver in"
              value={formatMoney(totals.kiwisaverAnnual, display)}
            />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  Savings rate
                </div>
                <div className="mt-1 font-mono tabular text-3xl font-semibold tracking-tight text-accent">
                  {formatPercent(savings.savingsRate, 0)}
                </div>
              </div>
              <div className="text-right text-[11px] leading-relaxed text-ink-400">
                <div>
                  Saving {formatMoney(savings.annualSavings, display)} of{" "}
                  {formatMoney(savings.incomeAvailable, display)}
                </div>
                <div className="mt-0.5">
                  Implied spending{" "}
                  {formatMoney(savings.impliedSpending, display)} / yr
                </div>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-gain transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, savings.savingsRate * 100))}%`,
                }}
              />
            </div>
            {budget.annualExpenses > 0 &&
              Math.abs(savings.impliedSpending - budget.annualExpenses) >
                budget.annualExpenses * 0.15 && (
                <p className="mt-3 text-[11px] leading-relaxed text-amber-400/90">
                  Income less savings implies you spend{" "}
                  {formatMoney(savings.impliedSpending, display)} a year, but
                  your{" "}
                  {budget.itemised ? "itemised expenses" : "expenses setting"}{" "}
                  come to {formatMoney(budget.annualExpenses, display)}. The
                  FIRE target is built from the recorded figure, so the gap is
                  worth reconciling.
                </p>
              )}
          </div>
        </div>
      )}

      <IncomeEditor
        isOpen={open}
        source={editing}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}

interface FigureProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "gain" | "loss";
}

function Figure({ label, value, hint, tone = "default" }: FigureProps) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
        {label}
      </div>
      <div
        className={
          "mt-1 font-mono tabular text-lg font-semibold tracking-tight " +
          (tone === "gain"
            ? "text-gain"
            : tone === "loss"
              ? "text-loss"
              : "text-white")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-ink-500">{hint}</div>}
    </div>
  );
}
