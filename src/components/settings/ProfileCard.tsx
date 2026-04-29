import type { Currency } from "@/types";

import { Input } from "@heroui/input";
import clsx from "clsx";

import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

export function ProfileCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  return (
    <Card eyebrow="About you" title="Profile">
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">
            Display currency
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["NZD", "USD"] as Currency[]).map((c) => (
              <button
                key={c}
                className={clsx(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                  settings.displayCurrency === c
                    ? "border-accent/40 bg-accent/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:text-white",
                )}
                onClick={() => update({ displayCurrency: c })}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            inputMode="numeric"
            label="Current age"
            value={settings.currentAge.toString()}
            variant="bordered"
            onValueChange={(v) =>
              update({ currentAge: parseInt(v) || 0 })
            }
          />
          <Input
            inputMode="numeric"
            label="Retirement age"
            value={settings.retirementAge.toString()}
            variant="bordered"
            onValueChange={(v) =>
              update({ retirementAge: parseInt(v) || 0 })
            }
          />
        </div>
      </div>
    </Card>
  );
}
