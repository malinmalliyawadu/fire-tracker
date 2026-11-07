import type { Scenario, SimulationInputs } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScenariosState {
  scenarios: Scenario[];
  comparedIds: string[];
  save: (name: string, color: string, inputs: SimulationInputs) => Scenario;
  remove: (id: string) => void;
  toggleCompare: (id: string) => void;
  rename: (id: string, name: string) => void;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const MAX_COMPARED = 3;

export const SCENARIO_COLORS = [
  "#2f7f6e",
  "#c78a2e",
  "#5b6b8c",
  "#a75c4f",
  "#7a5ea3",
  "#b06a8c",
];

export const useScenarios = create<ScenariosState>()(
  persist(
    (set, get) => ({
      scenarios: [],
      comparedIds: [],
      save: (name, color, inputs) => {
        const created: Scenario = {
          id: newId(),
          name,
          color,
          inputs,
          createdAt: new Date().toISOString(),
        };

        set({ scenarios: [...get().scenarios, created] });

        return created;
      },
      remove: (id) =>
        set({
          scenarios: get().scenarios.filter((s) => s.id !== id),
          comparedIds: get().comparedIds.filter((c) => c !== id),
        }),
      toggleCompare: (id) => {
        const current = get().comparedIds;
        const next = current.includes(id)
          ? current.filter((c) => c !== id)
          : [...current, id].slice(-MAX_COMPARED);

        set({ comparedIds: next });
      },
      rename: (id, name) =>
        set({
          scenarios: get().scenarios.map((s) =>
            s.id === id ? { ...s, name } : s,
          ),
        }),
    }),
    {
      name: "fire.scenarios.v1",
      version: 1,
    },
  ),
);
