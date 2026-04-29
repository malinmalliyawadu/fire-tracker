import { Button } from "@heroui/button";
import { Trash2 } from "lucide-react";

import { useHistory } from "@/store/history";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

export function DangerZone() {
  const resetPortfolio = usePortfolio((s) => s.reset);
  const resetSettings = useSettings((s) => s.reset);
  const scenarios = useScenarios((s) => s.scenarios);
  const removeScenario = useScenarios((s) => s.remove);
  const clearHistory = useHistory((s) => s.clear);

  const handleWipe = () => {
    if (
      window.confirm(
        "Wipe all data? This will remove your assets, liabilities, scenarios, history, and reset settings.",
      )
    ) {
      resetPortfolio();
      resetSettings();
      clearHistory();
      scenarios.forEach((s) => removeScenario(s.id));
    }
  };

  return (
    <Card eyebrow="Reset everything" title="Danger zone">
      <div className="flex items-center justify-between">
        <p className="max-w-md text-sm text-ink-400">
          Wipe your portfolio, scenarios, and settings. This cannot be undone.
        </p>
        <Button
          color="danger"
          startContent={<Trash2 className="h-3.5 w-3.5" />}
          variant="flat"
          onPress={handleWipe}
        >
          Wipe data
        </Button>
      </div>
    </Card>
  );
}
