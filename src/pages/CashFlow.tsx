import type { IncomeSource } from "@/types";

import { useState } from "react";

import { DebtRepaymentsSection } from "@/components/cashflow/DebtRepaymentsSection";
import { FlowBand } from "@/components/cashflow/FlowBand";
import { IncomeSection } from "@/components/cashflow/IncomeSection";
import { KidsSection } from "@/components/cashflow/KidsSection";
import { LifeEventsSection } from "@/components/cashflow/LifeEventsSection";
import { SpendingPhasesSection } from "@/components/cashflow/SpendingPhasesSection";
import { SpendingSection } from "@/components/cashflow/SpendingSection";
import { PageIntro } from "@/components/ui/Section";

export default function CashFlow() {
  // The income editor is shared between the band's empty state and the
  // income section, so its state lives here.
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource>();

  const addIncome = () => {
    setEditingIncome(undefined);
    setIncomeOpen(true);
  };
  const editIncome = (source: IncomeSource) => {
    setEditingIncome(source);
    setIncomeOpen(true);
  };

  return (
    <div className="space-y-16">
      <PageIntro
        lede="What comes in, what goes out, and the gap between them. The gap is your savings rate, and it sets the date."
        title="Cash flow"
      />
      <FlowBand onAddIncome={addIncome} />
      <IncomeSection
        editing={editingIncome}
        open={incomeOpen}
        onAdd={addIncome}
        onClose={() => setIncomeOpen(false)}
        onEdit={editIncome}
      />
      <SpendingSection />
      <DebtRepaymentsSection />
      <div className="grid gap-16 lg:grid-cols-2">
        <KidsSection />
        <LifeEventsSection />
      </div>
      <SpendingPhasesSection />
    </div>
  );
}
