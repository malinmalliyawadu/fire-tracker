import type { IncomeSource } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IncomeState {
  sources: IncomeSource[];
  upsert: (
    source: Omit<IncomeSource, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => void;
  remove: (id: string) => void;
  reset: () => void;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useIncome = create<IncomeState>()(
  persist(
    (set, get) => ({
      sources: [],
      upsert: (source) => {
        const now = new Date().toISOString();
        const existing = source.id
          ? get().sources.find((s) => s.id === source.id)
          : undefined;

        if (existing) {
          set({
            sources: get().sources.map((s) =>
              s.id === existing.id
                ? { ...existing, ...source, id: existing.id, updatedAt: now }
                : s,
            ),
          });
        } else {
          const created: IncomeSource = {
            ...source,
            id: newId(),
            createdAt: now,
            updatedAt: now,
          };

          set({ sources: [...get().sources, created] });
        }
      },
      remove: (id) =>
        set({ sources: get().sources.filter((s) => s.id !== id) }),
      reset: () => set({ sources: [] }),
    }),
    {
      name: "fire.income.v1",
      version: 1,
    },
  ),
);
