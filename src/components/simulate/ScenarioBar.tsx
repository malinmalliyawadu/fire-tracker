import type { Scenario } from "@/types";

import { Plus, X } from "lucide-react";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useScenarios } from "@/store/scenarios";

import { Card } from "@/components/ui/Card";

interface ScenarioBarProps {
  onSaveCurrent: () => void;
}

export function ScenarioBar({ onSaveCurrent }: ScenarioBarProps) {
  const scenarios = useScenarios((s) => s.scenarios);
  const comparedIds = useScenarios((s) => s.comparedIds);
  const toggleCompare = useScenarios((s) => s.toggleCompare);
  const remove = useScenarios((s) => s.remove);

  return (
    <Card
      action={
        <Button
          className="bg-accent text-white"
          size="sm"
          startContent={<Plus className="h-3.5 w-3.5" />}
          onPress={onSaveCurrent}
        >
          Save current
        </Button>
      }
      eyebrow="Compare up to 3"
      title="Saved scenarios"
    >
      {scenarios.length === 0 ? (
        <p className="py-3 text-sm text-ink-400">
          Tweak the controls then save your first scenario to compare it on the
          chart.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <ScenarioChip
              key={s.id}
              compared={comparedIds.includes(s.id)}
              scenario={s}
              onRemove={() => remove(s.id)}
              onToggle={() => toggleCompare(s.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface ScenarioChipProps {
  scenario: Scenario;
  compared: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

function ScenarioChip({
  scenario,
  compared,
  onToggle,
  onRemove,
}: ScenarioChipProps) {
  return (
    <div
      className={clsx(
        "group flex items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-1.5 text-sm transition-colors",
        compared
          ? "border-white/15 bg-white/[0.07]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
      )}
    >
      <button
        className="flex items-center gap-2"
        onClick={onToggle}
        title={compared ? "Hide on chart" : "Show on chart"}
      >
        <span
          className={clsx(
            "h-2.5 w-2.5 rounded-full transition-all",
            compared ? "ring-2 ring-white/30" : "opacity-70",
          )}
          style={{ backgroundColor: scenario.color }}
        />
        <span className={compared ? "text-white" : "text-ink-300"}>
          {scenario.name}
        </span>
      </button>
      <button
        aria-label={`Delete ${scenario.name}`}
        className="grid h-5 w-5 place-items-center rounded-full text-ink-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
