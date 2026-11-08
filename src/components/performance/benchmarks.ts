import type { BenchmarkId } from "@/domain/benchmark";

export interface BenchmarkStyle {
  label: string;
  /** For table headings, where there is less room. */
  short: string;
  stroke: string;
  /** Invested markets are solid, rates and prices are broken lines. */
  line: "solid" | "dashed" | "dotted";
}

/** Colour follows the benchmark, so switching one off never repaints another. */
export const BENCHMARK_STYLE: Record<BenchmarkId, BenchmarkStyle> = {
  plan: {
    label: "Your plan",
    short: "Plan",
    stroke: "var(--bench-plan)",
    line: "dashed",
  },
  inflation: {
    label: "Inflation",
    short: "Inflation",
    stroke: "var(--bench-inflation)",
    line: "dashed",
  },
  global: {
    label: "Global shares",
    short: "Global",
    stroke: "var(--bench-global)",
    line: "solid",
  },
  sp500: {
    label: "S&P 500",
    short: "S&P 500",
    stroke: "var(--bench-sp500)",
    line: "solid",
  },
  mix: {
    label: "Your mix in indices",
    short: "Your mix",
    stroke: "var(--bench-mix)",
    line: "solid",
  },
  mortgage: {
    label: "Paying off your mortgage",
    short: "Mortgage",
    stroke: "var(--bench-mortgage)",
    line: "dashed",
  },
  cash: {
    label: "Cash in the bank",
    short: "Cash",
    stroke: "var(--bench-cash)",
    line: "dotted",
  },
};
