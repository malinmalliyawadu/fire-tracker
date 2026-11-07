import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Section } from "@/components/ui/Section";

export function Currency() {
  const settings = useSettings((s) => s.settings);
  const refresh = useSettings((s) => s.refreshExchangeRate);
  const loading = useSettings((s) => s.fxLoading);

  const updated = settings.exchangeRateUpdatedAt
    ? formatDistanceToNow(new Date(settings.exchangeRateUpdatedAt), {
        addSuffix: true,
      })
    : "never";

  return (
    <Section
      aside={
        <Button
          icon={RefreshCw}
          loading={loading}
          size="sm"
          onClick={() => void refresh()}
        >
          Refresh rate
        </Button>
      }
      id="currency"
      lede="Anything held in US dollars is converted at this rate."
      title="Currency"
    >
      <Figure
        hint={`Updated ${updated}`}
        label="US dollars to NZ dollars"
        size="lg"
        value={settings.usdToNzd.toFixed(4)}
      />
    </Section>
  );
}
