import type { Scenario } from "@/types";

import { Plus, X } from "lucide-react";
import clsx from "clsx";

import { useScenarios } from "@/store/scenarios";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

interface ScenarioBarProps {
  onSaveCurrent: () => void;
}

export function ScenarioBar({ onSaveCurrent }: ScenarioBarProps) {
  const scenarios = useScenarios((s) => s.scenarios);
  const comparedIds = useScenarios((s) => s.comparedIds);
  const toggleCompare = useScenarios((s) => s.toggleCompare);
  const remove = useScenarios((s) => s.remove);

  return (
    <Section
      aside={
        <Button icon={Plus} size="sm" variant="primary" onClick={onSaveCurrent}>
          Save current
        </Button>
      }
      lede="Compare up to three on the chart."
      title="Saved scenarios"
    >
      {scenarios.length === 0 ? (
        <p className="text-[14px] text-ink-3">
          Move the controls, then save the result to lay it over the chart.
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
    </Section>
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
        "group flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-[13.5px] transition-colors duration-[var(--dur-hover)]",
        compared
          ? "border-ink bg-wash text-ink"
          : "border-line text-ink-2 hover:border-ink-3 hover:text-ink",
      )}
    >
      <button
        aria-pressed={compared}
        className="press flex items-center gap-2 rounded-full"
        title={compared ? "Hide on chart" : "Show on chart"}
        type="button"
        onClick={onToggle}
      >
        <span
          className={clsx(
            "h-2.5 w-2.5 rounded-full transition-opacity duration-[var(--dur-hover)]",
            compared ? "opacity-100" : "opacity-60",
          )}
          style={{ backgroundColor: scenario.color }}
        />
        <span className="font-medium">{scenario.name}</span>
      </button>
      <button
        aria-label={`Delete ${scenario.name}`}
        className="press grid h-6 w-6 place-items-center rounded-full text-ink-3 opacity-0 transition-[opacity,background-color,color] duration-[var(--dur-hover)] hover:bg-wash-strong hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        type="button"
        onClick={onRemove}
      >
        <X className="h-3 w-3" strokeWidth={2.25} />
      </button>
    </div>
  );
}
