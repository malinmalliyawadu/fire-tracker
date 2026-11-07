import type { IncomeSource } from "@/types";

import { Briefcase, Plus } from "lucide-react";

import { IncomeEditor } from "./IncomeEditor";

import { INCOME_TYPE_LABEL } from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { formatMoney, formatPercent } from "@/domain/format";
import { TAX_YEAR } from "@/domain/tax";
import { useSettings } from "@/store/settings";
import { useIncome } from "@/store/income";
import { useIncomeTotals } from "@/store/derived";
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
import { Tag } from "@/components/ui/Tag";

interface IncomeSectionProps {
  open: boolean;
  editing?: IncomeSource;
  onAdd: () => void;
  onEdit: (source: IncomeSource) => void;
  onClose: () => void;
}

export function IncomeSection({
  open,
  editing,
  onAdd,
  onEdit,
  onClose,
}: IncomeSectionProps) {
  const sources = useIncome((s) => s.sources);
  const settings = useSettings((s) => s.settings);
  const totals = useIncomeTotals();

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;

  return (
    <Section
      aside={
        <Button icon={Plus} size="sm" variant="primary" onClick={onAdd}>
          Add income
        </Button>
      }
      lede="Gross pay goes in. Tax, ACC and KiwiSaver are worked out from it."
      title="Income"
    >
      {sources.length === 0 ? (
        <EmptyState
          action={
            <Button size="sm" variant="primary" onClick={onAdd}>
              Add your income
            </Button>
          }
          description="Salary, self-employment, rental, anything that arrives in a year."
          icon={Briefcase}
          title="No income recorded"
        />
      ) : (
        <div className="space-y-6">
          <Ledger>
            <LedgerHead>
              <Th>Source</Th>
              <Th>Type</Th>
              <Th align="right">Gross a year</Th>
              <Th align="right">KiwiSaver</Th>
              <Th aria-label="Open" />
            </LedgerHead>
            <tbody>
              {sources.map((source) => {
                const annual =
                  toMonthly(
                    convert(source.amount, source.currency, display, rate),
                    source.frequency,
                  ) * 12;

                return (
                  <LedgerRow
                    key={source.id}
                    label={`Edit ${source.name}`}
                    onOpen={() => onEdit(source)}
                  >
                    <Td>
                      <Cell
                        primary={source.name}
                        secondary={
                          source.continuesInRetirement
                            ? "Continues in retirement"
                            : undefined
                        }
                      />
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-ink-2">
                        {INCOME_TYPE_LABEL[source.type]}
                        {source.currency === "USD" && <Tag>USD</Tag>}
                      </span>
                    </Td>
                    <Td num align="right">
                      <Money amount={annual} currency={display} />
                    </Td>
                    <Td num align="right" className="text-ink-2">
                      {source.kiwisaverRate != null ? (
                        formatPercent(source.kiwisaverRate, 0)
                      ) : (
                        <span className="text-ink-4">{"—"}</span>
                      )}
                    </Td>
                    <OpenCell />
                  </LedgerRow>
                );
              })}
            </tbody>
          </Ledger>

          <FigureRow cols={4}>
            <Figure
              label="Gross income"
              size="sm"
              value={formatMoney(totals.grossAnnual, display)}
            />
            <Figure
              hint={`PAYE and ACC, ${TAX_YEAR}`}
              label="Tax"
              size="sm"
              tone="loss"
              value={`-${formatMoney(totals.annualTax, display)}`}
            />
            <Figure
              label="Take-home"
              size="sm"
              tone="gain"
              value={formatMoney(totals.takeHomeAnnual, display)}
            />
            <Figure
              hint={
                totals.kiwisaverAnnual > 0
                  ? `You ${formatMoney(totals.employeeKiwisaverAnnual, display)}, employer ${formatMoney(totals.employerKiwisaverAnnual, display)}, government ${formatMoney(totals.govtContributionAnnual, display)}`
                  : "No salary with a KiwiSaver rate"
              }
              label="KiwiSaver in"
              size="sm"
              value={formatMoney(totals.kiwisaverAnnual, display)}
            />
          </FigureRow>
        </div>
      )}

      <IncomeEditor isOpen={open} source={editing} onClose={onClose} />
    </Section>
  );
}
