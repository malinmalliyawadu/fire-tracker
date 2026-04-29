import type { SimulationInputs } from "@/types";

import { Button } from "@heroui/button";
import { Check, Sparkles } from "lucide-react";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { SCENARIO_COLORS, useScenarios } from "@/store/scenarios";

import { DialogShell } from "@/components/ui/DialogShell";

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
          <span />
          <div className="flex gap-2">
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
          </div>
        </>
      }
      icon={Sparkles}
      isOpen={isOpen}
      size="md"
      subtitle="Pin these inputs and overlay them on the chart later"
      title="Save scenario"
      onClose={onClose}
    >
      <Input
        autoFocus
        classNames={{
          inputWrapper:
            "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15 group-data-[focus=true]:border-accent/40 group-data-[focus=true]:bg-accent/[0.04]",
        }}
        isRequired
        label="Name"
        labelPlacement="outside"
        placeholder="e.g. Conservative"
        value={name}
        variant="bordered"
        onValueChange={setName}
      />
      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          Color
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_COLORS.map((c) => {
            const active = color === c;

            return (
              <button
                key={c}
                aria-label={`Use color ${c}`}
                className={clsx(
                  "relative grid h-10 w-10 place-items-center rounded-xl transition-all",
                  active
                    ? "ring-2 ring-white/40 ring-offset-2 ring-offset-ink-900"
                    : "ring-0 hover:scale-105",
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                type="button"
              >
                {active && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </DialogShell>
  );
}
