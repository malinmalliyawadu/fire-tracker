import { DangerZone } from "@/components/settings/DangerZone";
import { ExchangeRateCard } from "@/components/settings/ExchangeRateCard";
import { GoalsCard } from "@/components/settings/GoalsCard";
import { HouseholdCard } from "@/components/settings/HouseholdCard";
import { KiwiSaverCard } from "@/components/settings/KiwiSaverCard";
import { NzSuperCard } from "@/components/settings/NzSuperCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { TaxCard } from "@/components/settings/TaxCard";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Tune the assumptions that drive your projections everywhere."
        eyebrow="Configuration"
        title="Settings"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard />
        <ExchangeRateCard />
      </div>
      <GoalsCard />
      <HouseholdCard />
      <TaxCard />
      <div className="grid gap-6 lg:grid-cols-2">
        <NzSuperCard />
        <KiwiSaverCard />
      </div>
      <DangerZone />
    </div>
  );
}
