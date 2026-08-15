import type { SimulationInputs } from "@/types";

import { Button } from "@heroui/button";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { SCENARIO_COLORS, useScenarios } from "@/store/scenarios";
import { useAutoFocus } from "@/hooks/useAutoFocus";
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
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-br from-accent to-accent-deep text-white shadow-[0_8px_24px_-8px_rgba(124,131,231,0.6)]"
            isDisabled={!name.trim()}
            onPress={handleSave}
          >
            Save scenario
          </Button>
        </>
      }
      icon={Sparkles}
      isOpen={isOpen}
      size="md"
      subtitle="Pin these inputs and overlay them on the chart later"
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
        <div className="flex flex-wrap gap-2">
          {SCENARIO_COLORS.map((c) => {
            const active = color === c;

            return (
              <button
                key={c}
                aria-label={`Use colour ${c}`}
                aria-pressed={active}
                className={clsx(
                  // An inset ring rather than an offset one: ring-offset paints
                  // a solid colour that can't match the modal's translucent,
                  // gradient-lit background.
                  "grid h-10 w-10 place-items-center rounded-xl transition-transform",
                  active
                    ? "ring-2 ring-inset ring-white/80"
                    : "hover:scale-105",
                )}
                style={{ backgroundColor: c }}
                type="button"
                onClick={() => setColor(c)}
              >
                {active && (
                  <Check
                    className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
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
