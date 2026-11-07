import type { SimulationInputs } from "@/types";

import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { SCENARIO_COLORS, useScenarios } from "@/store/scenarios";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { Button } from "@/components/ui/Button";
import { DialogShell } from "@/components/ui/DialogShell";
import { Field } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: SimulationInputs;
}

export function SaveScenarioModal({
  isOpen,
  onClose,
  inputs,
}: SaveScenarioModalProps) {
  const save = useScenarios((s) => s.save);
  const existingCount = useScenarios((s) => s.scenarios.length);
  const [name, setName] = useState("");
  const nameRef = useAutoFocus<HTMLInputElement>(isOpen);
  const [color, setColor] = useState(SCENARIO_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setName(`Scenario ${existingCount + 1}`);
      setColor(SCENARIO_COLORS[existingCount % SCENARIO_COLORS.length]);
    }
  }, [isOpen, existingCount]);

  const handleSave = () => {
    if (!name.trim()) return;
    save(name.trim(), color, inputs);
    onClose();
  };

  return (
    <DialogShell
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            variant="primary"
            onClick={handleSave}
          >
            Save scenario
          </Button>
        </>
      }
      icon={Sparkles}
      isOpen={isOpen}
      size="md"
      subtitle="Keep these inputs and lay them over the chart later"
      title="Save scenario"
      onClose={onClose}
    >
      <TextField
        required
        inputRef={nameRef}
        label="Name"
        placeholder="e.g. Conservative"
        value={name}
        onChange={setName}
      />

      <Field label="Colour">
        <div className="flex flex-wrap gap-2.5">
          {SCENARIO_COLORS.map((c) => {
            const active = color === c;

            return (
              <button
                key={c}
                aria-label={`Use colour ${c}`}
                aria-pressed={active}
                className={clsx(
                  "press grid h-9 w-9 place-items-center rounded-lg transition-shadow duration-[var(--dur-hover)]",
                  active && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                )}
                style={{ backgroundColor: c }}
                type="button"
                onClick={() => setColor(c)}
              >
                {active && (
                  <Check
                    className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Field>
    </DialogShell>
  );
}
