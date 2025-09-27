import type {
  AppData,
  Asset,
  Liability,
  Settings,
  NetWorthHistory,
  Milestone,
} from "../types/fire";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FireStore extends AppData {
  addAsset: (asset: Omit<Asset, "id" | "dateAdded" | "lastUpdated">) => void;
  updateAsset: (id: string, updates: Partial<Omit<Asset, "id">>) => void;
  deleteAsset: (id: string) => void;

  addLiability: (
    liability: Omit<Liability, "id" | "dateAdded" | "lastUpdated">,
  ) => void;
  updateLiability: (
    id: string,
    updates: Partial<Omit<Liability, "id">>,
  ) => void;
  deleteLiability: (id: string) => void;

  updateSettings: (settings: Partial<Settings>) => void;

  addNetWorthSnapshot: () => void;

  addMilestone: (milestone: Omit<Milestone, "id">) => void;
  updateMilestone: (
    id: string,
    updates: Partial<Omit<Milestone, "id">>,
  ) => void;
  deleteMilestone: (id: string) => void;
  achieveMilestone: (id: string) => void;

  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
}

const generateId = () => crypto.randomUUID();
const getCurrentTimestamp = () => new Date().toISOString();

export const useFireStore = create<FireStore>()(
  persist(
    (set, get) => ({
      assets: [
        {
          id: "sample-etf-1",
          name: "Smart US 500 ETF",
          type: "individual-stock" as const,
          accountType: "investment" as const,
          value: 101429,
          contributions: 250,
          contributionFrequency: "weekly" as const,
          dateAdded: "2023-01-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          stockSymbol: "SPY",
          stockCurrency: "USD" as const,
          autoUpdate: true,
          notes: "S&P 500 index fund tracking US market - 5,051 shares",
        },
        {
          id: "sample-nvidia-1",
          name: "NVIDIA Corp",
          type: "individual-stock" as const,
          accountType: "shares" as const,
          value: 2271.72,
          contributions: 50,
          contributionFrequency: "monthly" as const,
          dateAdded: "2023-06-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          stockSymbol: "NVDA",
          stockCurrency: "USD" as const,
          autoUpdate: true,
          notes: "AI and graphics processing leader - 12.7488 shares",
        },
        {
          id: "sample-apple-1",
          name: "Apple Inc",
          type: "individual-stock" as const,
          accountType: "shares" as const,
          value: 10084.07,
          contributions: 200,
          contributionFrequency: "monthly" as const,
          dateAdded: "2023-03-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          stockSymbol: "AAPL",
          stockCurrency: "USD" as const,
          autoUpdate: true,
          notes: "Tech giant - iPhone maker - 39.4741 shares",
        },
        {
          id: "sample-amd-1",
          name: "Advanced Micro Devices Inc",
          type: "individual-stock" as const,
          accountType: "shares" as const,
          value: 5245.17,
          contributions: 100,
          contributionFrequency: "monthly" as const,
          dateAdded: "2023-09-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          stockSymbol: "AMD",
          stockCurrency: "USD" as const,
          autoUpdate: true,
          notes: "CPU and GPU manufacturer - 32.8933 shares",
        },
        {
          id: "sample-microsoft-1",
          name: "Microsoft Corp",
          type: "individual-stock" as const,
          accountType: "shares" as const,
          value: 6617.51,
          contributions: 150,
          contributionFrequency: "monthly" as const,
          dateAdded: "2023-04-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          stockSymbol: "MSFT",
          stockCurrency: "USD" as const,
          autoUpdate: true,
          notes: "Cloud computing and software leader - 12.9384 shares",
        },
        {
          id: "sample-kiwisaver-1",
          name: "KiwiSaver",
          type: "kiwisaver" as const,
          accountType: "kiwisaver" as const,
          value: 115651.53,
          contributions: 920,
          contributionFrequency: "monthly" as const,
          dateAdded: "2024-01-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          kiwiSaverProvider: "simplicity",
          kiwiSaverFund: "Growth Fund",
          notes: "NZ retirement savings scheme",
        },
      ],
      liabilities: [
        {
          id: "sample-mortgage-1",
          name: "Home Mortgage",
          type: "mortgage" as const,
          balance: 450000,
          interestRate: 6.5,
          minimumPayment: 2800,
          paymentFrequency: "monthly" as const,
          dateAdded: "2024-01-01T00:00:00.000Z",
          lastUpdated: new Date().toISOString(),
          notes: "Primary residence mortgage",
        },
      ],
      settings: {
        fireTarget: 1500000,
        withdrawalRate: 0.04,
        expectedReturn: 0.07,
        inflationRate: 0.03,
        retirementAge: 65,
        currentAge: 34,
        currency: "NZD",
      },
      history: [],
      milestones: [
        {
          id: "milestone-1",
          name: "First $100k",
          targetAmount: 100000,
          achieved: true,
          achievedDate: "2024-01-15T00:00:00.000Z",
          description: "The hardest milestone - building initial momentum",
        },
        {
          id: "milestone-2",
          name: "Quarter Million",
          targetAmount: 250000,
          achieved: false,
          description: "Next major milestone on path to FIRE",
        },
        {
          id: "milestone-3",
          name: "Half Million",
          targetAmount: 500000,
          achieved: false,
          description: "Halfway to our FIRE target",
        },
      ],

      addAsset: (assetData) => {
        const asset: Asset = {
          ...assetData,
          id: generateId(),
          dateAdded: getCurrentTimestamp(),
          lastUpdated: getCurrentTimestamp(),
        };

        set((state) => ({
          assets: [...state.assets, asset],
        }));
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id
              ? { ...asset, ...updates, lastUpdated: getCurrentTimestamp() }
              : asset,
          ),
        }));
      },

      deleteAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        }));
      },

      addLiability: (liabilityData) => {
        const liability: Liability = {
          ...liabilityData,
          id: generateId(),
          dateAdded: getCurrentTimestamp(),
          lastUpdated: getCurrentTimestamp(),
        };

        set((state) => ({
          liabilities: [...state.liabilities, liability],
        }));
      },

      updateLiability: (id, updates) => {
        set((state) => ({
          liabilities: state.liabilities.map((liability) =>
            liability.id === id
              ? { ...liability, ...updates, lastUpdated: getCurrentTimestamp() }
              : liability,
          ),
        }));
      },

      deleteLiability: (id) => {
        set((state) => ({
          liabilities: state.liabilities.filter(
            (liability) => liability.id !== id,
          ),
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      addNetWorthSnapshot: () => {
        const { assets, liabilities } = get();
        const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
        const totalLiabilities = liabilities.reduce(
          (sum, liability) => sum + liability.balance,
          0,
        );

        const snapshot: NetWorthHistory = {
          id: generateId(),
          date: getCurrentTimestamp(),
          assets: totalAssets,
          liabilities: totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
        };

        set((state) => ({
          history: [...state.history, snapshot],
        }));
      },

      addMilestone: (milestoneData) => {
        const milestone: Milestone = {
          ...milestoneData,
          id: generateId(),
        };

        set((state) => ({
          milestones: [...state.milestones, milestone],
        }));
      },

      updateMilestone: (id, updates) => {
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone,
          ),
        }));
      },

      deleteMilestone: (id) => {
        set((state) => ({
          milestones: state.milestones.filter(
            (milestone) => milestone.id !== id,
          ),
        }));
      },

      achieveMilestone: (id) => {
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id
              ? {
                  ...milestone,
                  achieved: true,
                  achievedDate: getCurrentTimestamp(),
                }
              : milestone,
          ),
        }));
      },

      getTotalAssets: () => {
        const { assets } = get();

        return assets.reduce((sum, asset) => sum + asset.value, 0);
      },

      getTotalLiabilities: () => {
        const { liabilities } = get();

        return liabilities.reduce(
          (sum, liability) => sum + liability.balance,
          0,
        );
      },

      getNetWorth: () => {
        const { getTotalAssets, getTotalLiabilities } = get();

        return getTotalAssets() - getTotalLiabilities();
      },
    }),
    {
      name: "fire-tracker-store",
      version: 1,
    },
  ),
);
