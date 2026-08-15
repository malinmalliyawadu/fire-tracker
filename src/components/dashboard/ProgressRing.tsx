import { motion } from "framer-motion";

import { progressPercent } from "@/domain/fire";
import { yearsToTarget } from "@/domain/projection";
import { formatPercent, formatYears } from "@/domain/format";
import { useAccumulationProjection } from "@/store/derived";

interface ProgressRingProps {
  current: number;
  target: number;
}

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ current, target }: ProgressRingProps) {
  const projection = useAccumulationProjection();

  const pct = progressPercent(current, target);
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const years = yearsToTarget(projection, target);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg aria-hidden className="-rotate-90" height={SIZE} width={SIZE}>
        <defs>
          <linearGradient id="ring-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c83e7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        <motion.circle
          animate={{ strokeDashoffset: offset }}
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          r={RADIUS}
          stroke="url(#ring-gradient)"
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          strokeWidth={STROKE}
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
