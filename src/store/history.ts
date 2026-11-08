import type { AssetMix, Currency } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NetWorthSnapshot {
  id: string;
  date: string;
  netWorth: number;
  assetsTotal: number;
  liabilitiesTotal: number;
  currency: Currency;
  /**
   * Years to the traditional FIRE target as projected on the day. Lets the
   * overview show whether the date is drifting earlier or later. Absent on
   * snapshots taken before it was recorded.
   */
  yearsToFire?: number;
  /**
   * The pot the plan projects: assets that fund retirement, net of the debts
   * set against them. Recorded so the record and the projection sit on the
   * same basis. Absent on snapshots taken before it was recorded.
   */
  fireNetWorth?: number;
  /** Gross assets funding retirement: the base the plan's return compounds. */
  fireAssetsTotal?: number;
  /**
   * Those assets by kind, in the snapshot's currency. Lets a benchmark follow
   * what the pot held at the time. Absent on snapshots taken before it was
   * recorded, and history can't be reconstructed, so it is kept from day one.
   */
  fireAssetsByType?: AssetMix;
  /**
   * Monthly contributions into the pot at the time, in the snapshot's
   * currency. Lets later readings use the rate that actually applied in each
   * stretch of the record rather than smearing today's rate backwards.
   */
  monthlyContributions?: number;
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
