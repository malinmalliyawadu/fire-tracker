import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Asset, Liability } from "@/types";

interface PortfolioState {
  assets: Asset[];
  liabilities: Liability[];
  upsertAsset: (
    asset: Omit<Asset, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  removeAsset: (id: string) => void;
  upsertLiability: (
    liability: Omit<Liability, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => void;
  removeLiability: (id: string) => void;
  reset: () => void;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      assets: [],
      liabilities: [],
      upsertAsset: (asset) => {
        const now = new Date().toISOString();
        const existing = asset.id
          ? get().assets.find((a) => a.id === asset.id)
          : undefined;

        if (existing) {
          set({
            assets: get().assets.map((a) =>
              a.id === existing.id
                ? { ...existing, ...asset, id: existing.id, updatedAt: now }
                : a,
            ),
          });
        } else {
          const created: Asset = {
            ...asset,
            id: newId(),
            createdAt: now,
            updatedAt: now,
          };

          set({ assets: [...get().assets, created] });
        }
      },
      removeAsset: (id) =>
        set({ assets: get().assets.filter((a) => a.id !== id) }),
      upsertLiability: (liability) => {
        const now = new Date().toISOString();
        const existing = liability.id
          ? get().liabilities.find((l) => l.id === liability.id)
          : undefined;

        if (existing) {
          set({
            liabilities: get().liabilities.map((l) =>
              l.id === existing.id
                ? {
                    ...existing,
                    ...liability,
                    id: existing.id,
                    updatedAt: now,
                  }
                : l,
            ),
          });
        } else {
          const created: Liability = {
            ...liability,
            id: newId(),
            createdAt: now,
            updatedAt: now,
          };

          set({ liabilities: [...get().liabilities, created] });
        }
      },
      removeLiability: (id) =>
        set({ liabilities: get().liabilities.filter((l) => l.id !== id) }),
      reset: () => set({ assets: [], liabilities: [] }),
    }),
    {
      name: "fire.portfolio.v1",
      version: 1,
    },
  ),
);
