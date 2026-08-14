import type { Settings } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { FALLBACK_USD_TO_NZD, fetchUsdToNzd } from "@/domain/currency";

interface SettingsState {
  settings: Settings;
  fxLoading: boolean;
  update: (patch: Partial<Settings>) => void;
  refreshExchangeRate: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  displayCurrency: "NZD",
  currentAge: 30,
  retirementAge: 65,
  annualExpenses: 50_000,
  withdrawalRate: 0.04,
  expectedReturn: 0.07,
  inflationRate: 0.025,
  nzSuperAnnual: 28_000,
  nzSuperStartAge: 65,
  kiwisaverUnlockAge: 65,
  usdToNzd: FALLBACK_USD_TO_NZD,
  applyInvestmentTax: true,
  nzSuperStatus: "singleLivingAlone",
  household: {
    hasPartner: false,
    partnerAge: 30,
    includePartnerNzSuper: true,
  },
  // Defaults follow the common go-go / slow-go / no-go pattern: spending runs
  // a little hot early in retirement, then eases off as people slow down.
  spendingPhases: {
    enabled: false,
    goGoMultiplier: 1.1,
    slowGoFromAge: 75,
    slowGoMultiplier: 0.9,
    noGoFromAge: 85,
    noGoMultiplier: 0.85,
  },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      fxLoading: false,
      update: (patch) => set({ settings: { ...get().settings, ...patch } }),
      refreshExchangeRate: async () => {
        set({ fxLoading: true });
        const result = await fetchUsdToNzd();

        set({
          fxLoading: false,
          settings: {
            ...get().settings,
            usdToNzd: result.rate,
            exchangeRateUpdatedAt: result.timestamp,
          },
        });
      },
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "fire.settings.v1",
      version: 1,
      // Deep-merge settings so newly-added defaults survive a hydrate from
      // older persisted state (e.g. when fields like nzSuperAnnual are added).
      merge: (persisted, current) => {
        const p = persisted as { settings?: Partial<Settings> } | undefined;

        return {
          ...current,
          ...(p ?? {}),
          settings: {
            ...current.settings,
            ...(p?.settings ?? {}),
          },
        };
      },
    },
  ),
);
