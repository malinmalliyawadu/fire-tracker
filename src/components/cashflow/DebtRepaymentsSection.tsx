import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { LIABILITY_TYPE_LABEL } from "@/domain/labels";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useDebtSpending, usePlanBudget } from "@/store/derived";
import { Button } from "@/components/ui/Button";
import { Figure, FigureRow } from "@/components/ui/Figure";
import {
  Cell,
  Ledger,
  LedgerHead,
  LedgerRow,
  Td,
  Th,
} from "@/components/ui/Ledger";
import { Money } from "@/components/ui/Money";
import { Section } from "@/components/ui/Section";

/**
 * Debt repayments as a spending line, derived from the Portfolio's
 * liabilities rather than entered here.
 *
 * They're deliberately kept out of the itemised expense total: the projection
 * already amortises each loan and withdraws its repayment after retirement, so
 * entering the same mortgage as an expense would count it twice, and an
 * expense has no way to stop at payoff.
 */
export function DebtRepaymentsSection() {
  const debt = useDebtSpending();
  const budget = usePlanBudget();
  const currency = useSettings((s) => s.settings.displayCurrency);
  const navigate = useNavigate();

  if (debt.repayments.length === 0) return null;

  return (
    <Section
      aside={
        <Button
          iconEnd={ArrowUpRight}
          size="sm"
          variant="ghost"
          onClick={() => navigate("/portfolio")}
        >
          Edit in Portfolio
        </Button>
      }
      lede="Worked out from your liabilities, so they end at payoff rather than at retirement."
      title="Debt repayments"
    >
      <div className="space-y-6">
        <Ledger>
          <LedgerHead>
            <Th>Loan</Th>
            <Th>Type</Th>
            <Th>Until</Th>
            <Th align="right" className="w-32">
              A year
            </Th>
            <Th aria-label="Spacer" className="w-6" />
          </LedgerHead>
          <tbody>
            {debt.repayments.map((r) => (
              <LedgerRow key={r.id}>
                <Td>
                  <Cell
                    primary={r.name}
                    secondary={
                      !r.countsTowardFire
                        ? "Balance sits outside the FIRE pot, repayment still modelled"
                        : undefined
                    }
                  />
                </Td>
                <Td className="text-ink-2">{LIABILITY_TYPE_LABEL[r.type]}</Td>
                <Td className="whitespace-nowrap text-ink-3">
                  {r.payoffYear === null ? (
                    <span className="text-loss">Never clears</span>
                  ) : (
                    <>
                      <span className="num text-ink-2">{r.payoffYear}</span>
                      <span className="num ml-1.5">age {r.payoffAge}</span>
                    </>
                  )}
                </Td>
                <Td num align="right">
                  <Money amount={r.annual} currency={currency} />
                </Td>
                <td />
              </LedgerRow>
            ))}
          </tbody>
        </Ledger>

        <FigureRow cols={3}>
          <Figure
            hint={`${formatMoney(budget.annualExpenses + debt.annualTotal, currency)} total outgoings a year`}
            label="Repayments today"
            size="sm"
            value={formatMoney(debt.annualTotal, currency)}
          />
          <Figure
            hint={
              debt.annualPastRetirement > 0
                ? "Withdrawn from the portfolio"
                : "Every loan clears before you retire"
            }
            label="Still running at retirement"
            size="sm"
            value={formatMoney(debt.annualPastRetirement, currency)}
          />
          <Figure
            hint={
              debt.hasUnpayableDebt
                ? "A repayment doesn't cover its interest"
                : "When the last loan clears"
            }
            label="Debt free"
            size="sm"
            value={
              debt.hasUnpayableDebt || debt.lastPayoffYear === null
                ? "—"
                : String(debt.lastPayoffYear)
            }
          />
        </FigureRow>

        <p className="max-w-[70ch] text-[13px] leading-relaxed text-ink-3">
          These are modelled from each loan&apos;s balance and rate, so they
          stop at payoff rather than at retirement. They aren&apos;t part of the
          itemised total above, and they don&apos;t raise your FIRE target: that
          number assumes a withdrawal you can sustain forever, and a loan that
          ends isn&apos;t one.
        </p>
      </div>
    </Section>
  );
}
