import type { ProjectionPoint } from "@/types";

import clsx from "clsx";
import { useId, useMemo } from "react";

import { coastPoint } from "@/domain/projection";
import { formatMoneyCompact } from "@/domain/format";
import { useFireSummary } from "@/hooks/useFireSummary";
import { useSettings } from "@/store/settings";
import { useAfterTaxReturn, useCurrentProjection } from "@/store/derived";

interface Mark {
  age: number;
  label: string;
  /** Secondary marks hide on narrow screens. */
  minor?: boolean;
  tone?: "ink" | "flame";
}

const W = 1000;
const H = 240;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

/**
 * The journey: net worth across the rest of a life, with the moments that
 * matter marked on it. The one horizontal line is the target; the part of the
 * path that clears it is lit.
 */
export function JourneyBand() {
  const projection = useCurrentProjection();
  const summary = useFireSummary();
  const settings = useSettings((s) => s.settings);
  const afterTax = useAfterTaxReturn();
  const currency = settings.displayCurrency;
  const clipId = useId();

  const model = useMemo(() => {
    if (projection.length < 2) return null;

    const ages = projection.map((p) => p.age);
    const minAge = ages[0];
    const maxAge = ages[ages.length - 1];
    const span = Math.max(1, maxAge - minAge);

    const maxValue = Math.max(
      summary.target,
      ...projection.map((p) => p.netWorth),
    );
    const minValue = Math.min(0, ...projection.map((p) => p.netWorth));
    const top = maxValue * 1.08 || 1;
    const range = top - minValue || 1;

    const x = (age: number) => ((age - minAge) / span) * W;
    const y = (v: number) =>
      PAD_TOP + (1 - (v - minValue) / range) * (H - PAD_TOP - PAD_BOTTOM);

    const line = projection
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.age).toFixed(1)},${y(p.netWorth).toFixed(1)}`,
      )
      .join(" ");
    const area = `${line} L${x(maxAge).toFixed(1)},${y(minValue).toFixed(1)} L${x(minAge).toFixed(1)},${y(minValue).toFixed(1)} Z`;

    const targetY = y(summary.target);
    const baselineY = y(minValue);

    const realReturn = afterTax - settings.inflationRate;
    const coast = coastPoint(
      projection,
      summary.target,
      realReturn,
      settings.retirementAge,
    );
    const debtFree = projection.some((p) => p.debt > 0)
      ? (projection.find((p) => p.debt === 0)?.age ?? null)
      : null;

    const marks: Mark[] = [];

    if (summary.age !== null && !summary.reached && summary.age <= maxAge) {
      marks.push({
        age: summary.age,
        label: "Financially independent",
        tone: "flame",
      });
    }
    if (coast && coast.year > 0) {
      marks.push({ age: coast.age, label: "Could stop saving", minor: true });
    }
    if (settings.retirementAge > minAge && settings.retirementAge < maxAge) {
      marks.push({ age: settings.retirementAge, label: "Stop work" });
    }
    if (debtFree !== null && debtFree > minAge) {
      marks.push({ age: debtFree, label: "Debt free", minor: true });
    }

    const unlock = settings.kiwisaverUnlockAge;
    const pension = settings.nzSuperStartAge;

    if (unlock === pension && unlock > minAge && unlock < maxAge) {
      marks.push({ age: unlock, label: "KiwiSaver and NZ Super", minor: true });
    } else {
      if (unlock > minAge && unlock < maxAge) {
        marks.push({ age: unlock, label: "KiwiSaver unlocks", minor: true });
      }
      if (pension > minAge && pension < maxAge) {
        marks.push({ age: pension, label: "NZ Super starts", minor: true });
      }
    }

    marks.sort((a, b) => a.age - b.age);

    // Lay labels on two rows so neighbours never overlap.
    const laid = marks.map((m) => ({
      ...m,
      pct: ((m.age - minAge) / span) * 100,
      row: 0,
    }));
    const lastInRow = [-Infinity, -Infinity];

    for (const m of laid) {
      const row = m.pct - lastInRow[0] >= 15 ? 0 : 1;

      m.row = row;
      lastInRow[row] = m.pct;
    }

    // Ticks every 10 years from the first round age.
    const ticks: number[] = [];

    for (let a = Math.ceil(minAge / 10) * 10; a <= maxAge; a += 10)
      ticks.push(a);

    const firePoint =
      summary.age !== null && !summary.reached
        ? { x: x(summary.age), y: targetY }
        : null;

    return {
      line,
      area,
      targetY,
      baselineY,
      x,
      marks: laid,
      ticks,
      minAge,
      span,
      firePoint,
      peak: Math.max(...projection.map((p: ProjectionPoint) => p.netWorth)),
    };
  }, [projection, summary, settings, afterTax]);

  if (!model) return null;

  const { marks } = model;
  const rows = Math.max(1, ...marks.map((m) => m.row + 1));

  return (
    <figure className="select-none">
      {/* Labels above the band. */}
      <div
        className="relative mb-1 hidden sm:block"
        style={{ height: rows * 22 + 6 }}
      >
        {marks.map((m) => (
          <div
            key={`${m.label}-${m.age}`}
            className={clsx(
              "absolute flex -translate-x-1/2 flex-col items-center",
              m.minor && "hidden md:flex",
            )}
            style={{ left: `${m.pct}%`, top: m.row * 22 }}
          >
            <span
              className={clsx(
                "whitespace-nowrap text-[12.5px] leading-none",
                m.tone === "flame"
                  ? "font-medium text-flame-ink"
                  : "text-ink-2",
              )}
            >
              {m.label}
              <span className="num ml-1.5 text-ink-3">{m.age}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          aria-hidden
          className="block h-[200px] w-full sm:h-[240px]"
          preserveAspectRatio="none"
          viewBox={`0 0 ${W} ${H}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect height={model.targetY} width={W} x="0" y="0" />
            </clipPath>
          </defs>

          {/* Mark stems, drawn behind the curve. */}
          {marks.map((m) => (
            <line
              key={`${m.label}-${m.age}`}
              className={clsx(m.minor && "hidden md:block")}
              stroke={m.tone === "flame" ? "var(--flame)" : "var(--line)"}
              strokeDasharray={m.tone === "flame" ? undefined : "2 4"}
              vectorEffect="non-scaling-stroke"
              x1={model.x(m.age)}
              x2={model.x(m.age)}
              y1={0}
              y2={model.baselineY}
            />
          ))}

          <path d={model.area} fill="var(--ink)" opacity={0.06} />
          <path
            d={model.line}
            fill="none"
            stroke="var(--ink)"
            strokeLinejoin="round"
            strokeWidth={1.75}
            vectorEffect="non-scaling-stroke"
          />
          {/* The stretch of the path that clears the target. */}
          <path
            clipPath={`url(#${clipId})`}
            d={model.line}
            fill="none"
            stroke="var(--flame)"
            strokeLinejoin="round"
            strokeWidth={2.25}
            vectorEffect="non-scaling-stroke"
          />

          {/* Target */}
          <line
            stroke="var(--flame)"
            strokeDasharray="6 5"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            x1={0}
            x2={W}
            y1={model.targetY}
            y2={model.targetY}
          />

          {/* Baseline */}
          <line
            stroke="var(--line)"
            vectorEffect="non-scaling-stroke"
            x1={0}
            x2={W}
            y1={model.baselineY}
            y2={model.baselineY}
          />
        </svg>

        {/* Points live outside the stretched SVG so they stay round. */}
        <span
          aria-hidden
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-[3px] ring-[color:var(--bg)]"
          style={{
            left: 0,
            top: `${(model.baselineY / H) * 100}%`,
          }}
        />
        {model.firePoint && (
          <span
            aria-hidden
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flame ring-[3px] ring-[color:var(--bg)] shadow-[0_0_0_6px_var(--flame-wash)]"
            style={{
              left: `${(model.firePoint.x / W) * 100}%`,
              top: `${(model.firePoint.y / H) * 100}%`,
            }}
          />
        )}

        {/* Target label, pinned to the line's right end. */}
        <span
          className="num absolute right-0 -translate-y-full pb-1 text-[12px] text-flame-ink"
          style={{ top: `${(model.targetY / H) * 100}%` }}
        >
          Target {formatMoneyCompact(summary.target, currency)}
        </span>
      </div>

      {/* Age axis */}
      <div className="num relative mt-1.5 h-4 text-[11.5px] text-ink-3">
        <span className="absolute left-0">Age {model.minAge}</span>
        {model.ticks.map((age) => {
          const pct = ((age - model.minAge) / model.span) * 100;

          if (pct < 8 || pct > 94) return null;

          return (
            <span
              key={age}
              className="absolute -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {age}
            </span>
          );
        })}
        <span className="absolute right-0">{model.minAge + model.span}</span>
      </div>

      <figcaption className="sr-only">
        Projected net worth from age {model.minAge} to{" "}
        {model.minAge + model.span}, peaking at{" "}
        {formatMoneyCompact(model.peak, currency)}.
      </figcaption>
    </figure>
  );
}
