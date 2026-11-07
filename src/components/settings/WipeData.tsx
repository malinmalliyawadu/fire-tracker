import { Trash2 } from "lucide-react";
import { useState } from "react";

import { useExpenses } from "@/store/expenses";
import { useHistory } from "@/store/history";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/Button";

export function WipeData() {
  const resetPortfolio = usePortfolio((s) => s.reset);
  const resetIncome = useIncome((s) => s.reset);
  const resetExpenses = useExpenses((s) => s.reset);
  const resetSettings = useSettings((s) => s.reset);
  const scenarios = useScenarios((s) => s.scenarios);
  const removeScenario = useScenarios((s) => s.remove);
  const clearHistory = useHistory((s) => s.clear);

  const [confirming, setConfirming] = useState(false);

  const wipe = () => {
    resetPortfolio();
    resetSettings();
    resetIncome();
    resetExpenses();
    clearHistory();
    scenarios.forEach((s) => removeScenario(s.id));
    setConfirming(false);
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[15px] font-medium text-ink">Start over</h3>
        <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-snug text-ink-3">
          Remove every asset, debt, income, expense, scenario and snapshot, and
          put the settings back to their defaults.
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13.5px] text-loss">
            This removes everything and cannot be undone.
          </span>
          <Button variant="danger" onClick={wipe}>
            Yes, wipe everything
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <Button
          icon={Trash2}
          variant="danger"
          onClick={() => setConfirming(true)}
        >
          Wipe all data
        </Button>
      )}
    </div>
  );
}
