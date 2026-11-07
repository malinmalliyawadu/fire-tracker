import { Briefcase, Plus } from "lucide-react";
import clsx from "clsx";

import { formatMoney, formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import {
  useDebtSpending,
  useIncomeTotals,
  usePlanBudget,
  useSavingsSummary,
} from "@/store/derived";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";

interface Segment {
  key: string;
  label: string;
  amount: number;
  className: string;
}

interface FlowBandProps {
  onAddIncome: () => void;
}

/**
 * Where a year's income goes, as one bar read left to right: tax, KiwiSaver,
 * spending, loan repayments, and what is left. The leftover is the only
 * segment in the hot colour, because it is the one that moves the date.
 */
export function FlowBand({ onAddIncome }: FlowBandProps) {
  const income = useIncomeTotals();
  const savings = useSavingsSummary();
  const budget = usePlanBudget();
  const debt = useDebtSpending();
  const currency = useSettings((s) => s.settings.displayCurrency);

  if (!savings.hasIncome) {
    return (
      <EmptyState
        action={
          <Button icon={Plus} variant="primary" onClick={onAddIncome}>
            Add income
          </Button>
        }
        description="Your savings rate is the strongest predictor of when you reach FIRE, and it needs income to mean anything."
        icon={Briefcase}
        title="Nothing coming in yet"
      />
    );
  }

  // Everything that arrives in a year, before anything is taken out.
  const total = income.annualTax + savings.incomeAvailable;
  const kiwisaver = income.kiwisaverAnnual;
  const repayments = debt.annualTotal;
  // Implied spending already excludes KiwiSaver; loan repayments come out of
  // it, so they are shown as their own slice rather than inside spending.
  const spending = Math.max(0, savings.impliedSpending - repayments);
  const saved = Math.max(0, savings.annualSavings - kiwisaver);

  const segments: Segment[] = [
    {
      key: "tax",
      label: "Tax",
      amount: income.annualTax,
      className: "bg-ink-4",
    },
    {
      key: "kiwisaver",
      label: "KiwiSaver",
      amount: kiwisaver,
      className: "bg-ink/60",
    },
    {
      key: "spending",
      label: "Spending",
      amount: spending,
      className: "bg-ink-3",
    },
    {
      key: "debt",
      label: "Loan repayments",
      amount: repayments,
      className: "bg-ink-2",
    },
    { key: "saved", label: "Saved", amount: saved, className: "bg-flame" },
  ].filter((s) => s.amount > 0);

  const share = (amount: number) => (total > 0 ? amount / total : 0);

  const gap = savings.impliedSpending - budget.annualExpenses;
  const reconcile =
    budget.annualExpenses > 0 && Math.abs(gap) > budget.annualExpenses * 0.15;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 className="display-wide text-[26px] text-ink sm:text-[28px]">
          Saving{" "}
          <span className="num">{formatPercent(savings.savingsRate, 0)}</span>{" "}
          of what comes in
        </h2>
        <p className="text-[15px] text-ink-2">
          That&apos;s{" "}
          <span className="num">
            {formatMoney(savings.annualSavings, currency)}
          </span>{" "}
          of{" "}
          <span className="num">
            {formatMoney(savings.incomeAvailable, currency)}
          </span>{" "}
          a year, after tax
        </p>
      </div>

      <div
        aria-label="Where a year's income goes"
        className="mt-5 flex h-11 w-full gap-[2px] overflow-hidden rounded-md"
        role="img"
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className={clsx(
              "h-full transition-[flex-grow] duration-500 ease-[var(--ease-out)]",
              s.className,
            )}
            style={{ flexGrow: share(s.amount), flexBasis: 0 }}
            title={`${s.label}: ${formatMoney(s.amount, currency)}`}
          />
        ))}
      </div>

      {/* Labels sit under their segment on wide screens. */}
      <div className="mt-2 hidden w-full sm:flex">
        {segments.map((s) => {
          const pct = share(s.amount);

          return (
            <div
              key={s.key}
              className="min-w-0 overflow-hidden pr-3"
              style={{ flexGrow: pct, flexBasis: 0 }}
            >
              {pct >= 0.045 && (
                <div className="truncate text-[13px] text-ink">{s.label}</div>
              )}
              {pct >= 0.07 && (
                <div className="num truncate text-[12.5px] text-ink-3">
                  {formatMoney(s.amount, currency)}
                  <span className="ml-1">{formatPercent(pct, 0)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full legend for narrow screens, and for slices too thin to label. */}
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:hidden">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className={clsx(
                "h-2.5 w-2.5 shrink-0 rounded-[3px]",
                s.className,
              )}
            />
            <span className="text-ink-2">{s.label}</span>
            <span className="num ml-auto text-ink-3">
              {formatPercent(share(s.amount), 0)}
            </span>
          </li>
        ))}
      </ul>

      {reconcile && (
        <Callout
          className="mt-6"
          title={`Income less savings implies you spend ${formatMoney(savings.impliedSpending, currency)} a year, but you have recorded ${formatMoney(budget.annualExpenses, currency)}`}
          tone="note"
        >
          The FIRE target is built from the{" "}
          {budget.itemised ? "itemised expenses" : "settings figure"}, so the
          gap is worth reconciling. Either some spending is missing below, or
          some saving is not recorded against an asset.
        </Callout>
      )}
    </div>
  );
}
