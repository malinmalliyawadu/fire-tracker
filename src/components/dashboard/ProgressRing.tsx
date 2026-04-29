import { motion } from "framer-motion";

import { progressPercent, yearsToFire } from "@/domain/fire";
import { formatPercent, formatYears } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePortfolioTotals } from "@/store/derived";

interface ProgressRingProps {
  current: number;
  target: number;
}

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ current, target }: ProgressRingProps) {
  const settings = useSettings((s) => s.settings);
  const totals = usePortfolioTotals();

  const pct = progressPercent(current, target);
  const offset = CIRCUMFERENCE * (1 - pct / 100);

  const years = yearsToFire({
    netWorth: current,
    monthlyContribution: totals.monthlyContributions,
    target,
    expectedReturn: settings.expectedReturn,
  });

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id="ring-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c83e7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          Progress
        </div>
        <div className="mt-1 font-mono tabular text-3xl font-bold tracking-tight">
          {formatPercent(pct / 100, 0)}
        </div>
        <div className="mt-1 text-xs text-ink-300">
          {formatYears(years)} to FIRE
        </div>
      </div>
    </div>
  );
}
