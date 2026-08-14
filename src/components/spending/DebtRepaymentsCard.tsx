import { Link } from "react-router-dom";

import { LIABILITY_TYPE_LABEL } from "@/domain/labels";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useDebtSpending, usePlanBudget } from "@/store/derived";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

/**
 * Debt repayments as a spending line, derived from the Dashboard's
 * liabilities rather than entered here.
 *
 * They're deliberately kept out of the itemised expense total: the projection
 * already amortises each loan and withdraws its repayment after retirement, so
 * entering the same mortgage as an expense would count it twice — and worse,
 * an expense has no way to stop at payoff, so it would run forever.
 */
export function DebtRepaymentsCard() {
  const debt = useDebtSpending();
  const budget = usePlanBudget();
  const currency = useSettings((s) => s.settings.displayCurrency);

  // Nothing derived means nothing to say. The card would only add noise to a
  // page that's already several cards long.
  if (debt.repayments.length === 0) return null;

  return (
    <Card
      action={
        <Link
          className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-300 transition hover:border-white/15 hover:text-white"
          to="/"
        >
          Edit on Dashboard
        </Link>
      }
      eyebrow="Derived from your liabilities"
      title="Debt repayments"
    >
      <div className="space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3 text-left font-medium">Name</th>
                <th className="pb-3 text-left font-medium">Type</th>
                <th className="pb-3 text-left font-medium">Applies</th>
                {/* Widths are pinned here and on the Expenses table so the
                    money columns of the two stacked cards line up. */}
                <th className="w-32 pb-3 text-right font-medium">Per year</th>
                <th className="w-9 pb-3" />
              </tr>
            </thead>
            <tbody>
              {debt.repayments.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="py-3.5">
                    <div className="font-medium">{r.name}</div>
                    {!r.countsTowardFire && (
                      <div className="mt-0.5 text-xs text-ink-400">
                        Balance sits outside the FIRE pot, but the repayment is
                        still modelled
                      </div>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-ink-300">
                      {LIABILITY_TYPE_LABEL[r.type]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3.5 text-xs text-ink-400">
                    {r.payoffYear === null ? (
                      <span className="text-loss">Never clears</span>
                    ) : (
                      <>
                        Until {r.payoffYear}
                        <span className="ml-1 text-ink-500">
                          (age {r.payoffAge})
                        </span>
                      </>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    <Money amount={r.annual} currency={currency} />
                  </td>
                  <td className="py-3.5 pl-2">
                    <span aria-hidden className="block h-3.5 w-3.5 p-1.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-3">
          <Figure
            hint={`${formatMoney(budget.annualExpenses + debt.annualTotal, currency)} total outgoings`}
            label="Repayments today"
            value={formatMoney(debt.annualTotal, currency)}
          />
          <Figure
            hint={
              debt.annualPastRetirement > 0
                ? "Withdrawn from the portfolio"
                : "Every loan clears before you retire"
            }
            label="Still running at retirement"
            value={formatMoney(debt.annualPastRetirement, currency)}
          />
          <Figure
            hint={
              debt.hasUnpayableDebt
                ? "A repayment doesn't cover its interest"
                : "When the last loan clears"
            }
            label="Debt free"
            value={
              debt.hasUnpayableDebt || debt.lastPayoffYear === null
                ? "—"
                : String(debt.lastPayoffYear)
            }
          />
        </div>

        <p className="text-xs leading-relaxed text-ink-400">
          These are modelled from each loan&apos;s balance and rate, so they
          stop at payoff rather than at retirement. They aren&apos;t part of the
          itemised total above, and they don&apos;t raise your FIRE target: that
          number assumes a withdrawal you can sustain forever, and a loan that
          ends isn&apos;t one.
        </p>
      </div>
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
