import { Button } from "@heroui/button";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

export function ExchangeRateCard() {
  const settings = useSettings((s) => s.settings);
  const refresh = useSettings((s) => s.refreshExchangeRate);
  const loading = useSettings((s) => s.fxLoading);

  const updated = settings.exchangeRateUpdatedAt
    ? formatDistanceToNow(new Date(settings.exchangeRateUpdatedAt), {
        addSuffix: true,
      })
    : "never";

  return (
    <Card eyebrow="Live rate" title="USD → NZD">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono tabular text-3xl font-semibold tracking-tight">
            {settings.usdToNzd.toFixed(4)}
          </div>
          <div className="mt-1 text-xs text-ink-400">
            Updated {updated}
          </div>
        </div>
        <Button
          isLoading={loading}
          startContent={!loading && <RefreshCw className="h-3.5 w-3.5" />}
          variant="flat"
          onPress={refresh}
        >
          Refresh
        </Button>
      </div>
    </Card>
  );
}
