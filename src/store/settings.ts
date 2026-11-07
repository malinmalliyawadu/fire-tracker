import type { Settings, StoredSettings } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { birthDateForAge, mergeSettings, withAges } from "@/domain/age";
import { FALLBACK_USD_TO_NZD, fetchUsdToNzd } from "@/domain/currency";

interface SettingsState {
  /** The settings as kept: birth dates, never ages. */
  stored: StoredSettings;
  /** The settings as used, with today's ages filled in. */
  settings: Settings;
  fxLoading: boolean;
  update: (patch: Partial<Settings>) => void;
  /** Re-read the ages off the birth dates. Changes nothing until a birthday. */
  refreshAges: () => void;
  refreshExchangeRate: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_STORED: StoredSettings = {
  displayCurrency: "NZD",
  birthDate: birthDateForAge(30),
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
    partnerBirthDate: birthDateForAge(30),
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
      stored: DEFAULT_STORED,
      settings: withAges(DEFAULT_STORED),
      fxLoading: false,
      update: (patch) => {
        const stored = mergeSettings(get().stored, patch);

        set({ stored, settings: withAges(stored) });
      },
      refreshAges: () => {
        const { stored, settings } = get();
        const next = withAges(stored);

        if (
          next.currentAge !== settings.currentAge ||
          next.household.partnerAge !== settings.household.partnerAge
        ) {
          set({ settings: next });
        }
      },
      refreshExchangeRate: async () => {
        set({ fxLoading: true });
        const result = await fetchUsdToNzd();

        get().update({
          usdToNzd: result.rate,
          exchangeRateUpdatedAt: result.timestamp,
        });
        set({ fxLoading: false });
      },
      reset: () =>
        set({ stored: DEFAULT_STORED, settings: withAges(DEFAULT_STORED) }),
    }),
    {
      name: "fire.settings.v1",
      version: 1,
      partialize: (state) => ({ stored: state.stored }),
      // Fold whatever was persisted into today's defaults, so fields added
      // since survive a hydrate. Older versions kept `settings` with ages
      // where `stored` now holds birth dates; mergeSettings turns one into
      // the other.
      merge: (persisted, current) => {
        const p = persisted as
          | { stored?: Partial<Settings>; settings?: Partial<Settings> }
          | undefined;
        const stored = mergeSettings(
          current.stored,
          p?.stored ?? p?.settings ?? {},
        );

        return { ...current, stored, settings: withAges(stored) };
      },
      // Write the merged shape straight back. Left as it was, state from an
      // older version would be re-read on every load, and an age with no
      // date behind it would become a fresh birthday each time.
      onRehydrateStorage: () => (state) => state?.update({}),
    },
  ),
);
