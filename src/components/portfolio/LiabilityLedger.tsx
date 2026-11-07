import type { Liability } from "@/types";

import { CreditCard, EyeOff, Plus } from "lucide-react";
import { useState } from "react";

import { LiabilityEditor } from "./LiabilityEditor";

import { LIABILITY_TYPE_LABEL } from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { countsTowardFire } from "@/domain/fire";
import { formatPercent } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePortfolio } from "@/store/portfolio";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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

export function LiabilityLedger() {
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
    <Section
      aside={
        <Button icon={Plus} size="sm" onClick={startAdd}>
          Add liability
        </Button>
      }
      title="Liabilities"
    >
      {liabilities.length === 0 ? (
        <EmptyState
          action={
            <Button size="sm" onClick={startAdd}>
              Add a liability
            </Button>
          }
          description="Mortgages, loans and cards. Each one amortises at its own rate in the projection."
          icon={CreditCard}
          title="No debts recorded"
        />
      ) : (
        <Ledger>
          <LedgerHead>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th align="right">Rate</Th>
            <Th align="right">Balance</Th>
            <Th align="right">Monthly payment</Th>
            <Th aria-label="Open" />
          </LedgerHead>
          <tbody>
            {liabilities.map((l) => {
              const balance = convert(l.balance, l.currency, display, rate);
              const monthlyPayment = toMonthly(
                convert(l.payment, l.currency, display, rate),
                l.frequency,
              );

              return (
                <LedgerRow
                  key={l.id}
                  label={`Edit ${l.name}`}
                  onOpen={() => startEdit(l)}
                >
                  <Td>
                    <Cell primary={l.name} secondary={l.notes} />
                  </Td>
                  <Td>
                    <span className="inline-flex flex-wrap items-center gap-1.5 text-ink-2">
                      {LIABILITY_TYPE_LABEL[l.type]}
                      {l.currency === "USD" && <Tag>USD</Tag>}
                      {!countsTowardFire(l) && (
                        <Tag
                          icon={EyeOff}
                          title="Subtracted from net worth, but left out of the FIRE pot"
                        >
                          Not in FIRE
                        </Tag>
                      )}
                    </span>
                  </Td>
                  <Td num align="right" className="text-ink-2">
                    {formatPercent(l.interestRate, 2)}
                  </Td>
                  <Td num align="right">
                    <Money amount={balance} currency={display} />
                  </Td>
                  <Td num align="right">
                    {l.payment > 0 ? (
                      <Money amount={monthlyPayment} currency={display} />
                    ) : (
                      <span className="text-ink-4">&mdash;</span>
                    )}
                  </Td>
                  <OpenCell />
                </LedgerRow>
              );
            })}
          </tbody>
        </Ledger>
      )}

      <LiabilityEditor
        isOpen={open}
        liability={editing}
        onClose={() => setOpen(false)}
      />
    </Section>
  );
}
