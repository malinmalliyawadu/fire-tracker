import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { AssetTable } from "@/components/dashboard/AssetTable";
import { FireTypeCards } from "@/components/dashboard/FireTypeCards";
import { LiabilityTable } from "@/components/dashboard/LiabilityTable";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { NetWorthHistoryCard } from "@/components/dashboard/NetWorthHistoryCard";
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
      <AllocationCard />
      <AssetTable />
      <LiabilityTable />
    </div>
  );
}
