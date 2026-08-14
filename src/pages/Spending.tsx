import { DebtRepaymentsCard } from "@/components/spending/DebtRepaymentsCard";
import { ExpensesCard } from "@/components/spending/ExpensesCard";
import { KidsCard } from "@/components/spending/KidsCard";
import { LifeEventsCard } from "@/components/spending/LifeEventsCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SpendingPhasesCard } from "@/components/spending/SpendingPhasesCard";

export default function Spending() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="What you spend sets your FIRE number. Itemise it, and say which costs change when you stop working."
        eyebrow="Outgoings"
        title="Spending"
      />
      <ExpensesCard />
      <DebtRepaymentsCard />
      <div className="grid gap-6 lg:grid-cols-2">
        <KidsCard />
        <LifeEventsCard />
      </div>
      <SpendingPhasesCard />
    </div>
  );
}
