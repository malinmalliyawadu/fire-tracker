import type { Liability } from "@/types";

import { CreditCard, Pencil } from "lucide-react";
import { Button } from "@heroui/button";
import { useState } from "react";

import {
  FREQUENCY_SHORT,
  LIABILITY_TYPE_LABEL,
} from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePortfolio } from "@/store/portfolio";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";

import { LiabilityEditor } from "./LiabilityEditor";

export function LiabilityTable() {
  const liabilities = usePortfolio((s) => s.liabilities);
  const settings = useSettings((s) => s.settings);
  const [editing, setEditing] = useState<Liability | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (l: Liability) => {
    setEditing(l);
    setOpen(true);
  };

  return (
    <Card
      action={
        <Button
          className="bg-white/5 text-white"
          size="sm"
          variant="flat"
          onPress={startAdd}
        >
          + Add liability
        </Button>
      }
      eyebrow="Debts"
      title="Liabilities"
    >
      {liabilities.length === 0 ? (
        <EmptyState
          action={
            <Button
              className="bg-white/5"
              size="sm"
              variant="flat"
              onPress={startAdd}
            >
              Add a liability
            </Button>
          }
          description="Mortgages, student loans, credit cards — track everything that subtracts from your net worth."
          icon={CreditCard}
          title="No liabilities — nice"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3 text-left font-medium">Name</th>
                <th className="pb-3 text-left font-medium">Type</th>
                <th className="pb-3 text-right font-medium">Rate</th>
                <th className="pb-3 text-right font-medium">Balance</th>
                <th className="pb-3 text-right font-medium">Payment</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {liabilities.map((l) => {
                const balance = convert(l.balance, l.currency, display, rate);
                const monthlyPayment = toMonthly(
                  convert(l.payment, l.currency, display, rate),
                  l.frequency,
                );

                return (
                  <tr
                    key={l.id}
                    className="group border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-3.5 font-medium">{l.name}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-ink-300">
                        {LIABILITY_TYPE_LABEL[l.type]}
                        {l.currency === "USD" && (
                          <span className="text-[10px] text-accent">USD</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono tabular text-ink-300">
                      {formatPercent(l.interestRate, 2)}
                    </td>
                    <td className="py-3.5 text-right text-loss">
                      <Money amount={balance} currency={display} />
                    </td>
                    <td className="py-3.5 text-right text-ink-200">
                      {l.payment > 0 ? (
                        <>
                          <Money
                            amount={monthlyPayment}
                            currency={display}
                          />
                          <span className="ml-1 text-xs text-ink-400">
                            {FREQUENCY_SHORT.monthly}
                          </span>
                        </>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <button
                        aria-label={`Edit ${l.name}`}
                        className="rounded-md p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                        onClick={() => startEdit(l)}
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
      )}

      <LiabilityEditor
        isOpen={open}
        liability={editing}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}
