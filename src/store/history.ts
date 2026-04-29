import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Currency } from "@/types";

export interface NetWorthSnapshot {
  id: string;
  date: string;
  netWorth: number;
  assetsTotal: number;
  liabilitiesTotal: number;
  currency: Currency;
}

interface HistoryState {
  snapshots: NetWorthSnapshot[];
  /**
   * Insert or update today's snapshot in-place. Multiple calls on the same
   * day replace the existing entry rather than creating duplicates.
   */
  takeSnapshot: (snap: Omit<NetWorthSnapshot, "id" | "date">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const dayKey = (iso: string): string => iso.slice(0, 10);

export const useHistory = create<HistoryState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      takeSnapshot: (snap) => {
        const now = new Date().toISOString();
        const today = dayKey(now);
        const existingIdx = get().snapshots.findIndex(
          (s) => dayKey(s.date) === today,
        );

        if (existingIdx >= 0) {
          const updated = [...get().snapshots];
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...snap,
            date: now,
          };
          set({ snapshots: updated });
        } else {
          const created: NetWorthSnapshot = {
            ...snap,
            id: newId(),
            date: now,
          };

          set({
            snapshots: [...get().snapshots, created].sort((a, b) =>
              a.date.localeCompare(b.date),
            ),
          });
        }
      },
      remove: (id) =>
        set({ snapshots: get().snapshots.filter((s) => s.id !== id) }),
      clear: () => set({ snapshots: [] }),
    }),
    {
      name: "fire.history.v1",
      version: 1,
    },
  ),
);
