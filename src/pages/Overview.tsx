import { Checks } from "@/components/overview/Checks";
import { Headline } from "@/components/overview/Headline";
import { History } from "@/components/overview/History";
import { JourneyBand } from "@/components/overview/JourneyBand";
import { Pulse } from "@/components/overview/Pulse";
import { Tracking } from "@/components/overview/Tracking";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

/**
 * The page opened most often, so it leads with what moves: the date, the
 * month's change, the path, and the record. Standing facts live elsewhere.
 */
export default function Overview() {
  return (
    <div className="space-y-14">
      <OnboardingGate />
      <div className="space-y-10">
        <Headline />
        <Pulse />
      </div>
      <JourneyBand />
      <div className="grid gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <History />
        <Tracking />
      </div>
      <Checks />
    </div>
  );
}
