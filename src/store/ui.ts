import type { BenchmarkId } from "@/domain/benchmark";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

interface UiState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  /** Off rather than on, so a benchmark added later arrives switched on. */
  benchmarksHidden: BenchmarkId[];
  toggleBenchmark: (id: BenchmarkId) => void;
  /** Take NZ investment tax off the indices on the Performance page. */
  benchmarksAfterTax: boolean;
  setBenchmarksAfterTax: (afterTax: boolean) => void;
}

/** Interface preferences. Separate from plan settings so a backup never carries them. */
export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      // Seven lines is a tangle, so the situational ones start switched off.
      benchmarksHidden: ["mix", "mortgage", "cash"],
      toggleBenchmark: (id) =>
        set(({ benchmarksHidden }) => ({
          benchmarksHidden: benchmarksHidden.includes(id)
            ? benchmarksHidden.filter((other) => other !== id)
            : [...benchmarksHidden, id],
        })),
      benchmarksAfterTax: true,
      setBenchmarksAfterTax: (benchmarksAfterTax) =>
        set({ benchmarksAfterTax }),
    }),
    { name: "fire.ui.v1", version: 1 },
  ),
);

export const resolveTheme = (mode: ThemeMode): "light" | "dark" => {
  if (mode !== "system") return mode;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
