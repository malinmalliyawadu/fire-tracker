import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { AssetTable } from "@/components/dashboard/AssetTable";
import { FireTypeCards } from "@/components/dashboard/FireTypeCards";
import { LiabilityTable } from "@/components/dashboard/LiabilityTable";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { AssumptionsCard } from "@/components/dashboard/AssumptionsCard";
import { NetWorthHistoryCard } from "@/components/dashboard/NetWorthHistoryCard";
import { PlanTrackingCard } from "@/components/dashboard/PlanTrackingCard";
import { IncomeCard } from "@/components/income/IncomeCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Where you stand today, and how far you are from financial independence."
        eyebrow="Overview"
        title="Dashboard"
      />
      <NetWorthHero />
      <FireTypeCards />
      <NetWorthHistoryCard />
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanTrackingCard />
        <AssumptionsCard />
      </div>
      <IncomeCard />
      <AllocationCard />
      <AssetTable />
      <LiabilityTable />
    </div>
  );
}
