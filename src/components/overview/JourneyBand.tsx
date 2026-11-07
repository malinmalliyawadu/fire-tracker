import type { KeyboardEvent, PointerEvent } from "react";

import clsx from "clsx";
import { format, parseISO } from "date-fns";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { convert } from "@/domain/currency";
import { coastPoint } from "@/domain/projection";
import { formatMoney, formatMoneyCompact } from "@/domain/format";
import { yearsBetween } from "@/domain/tracking";
import { useFireSummary } from "@/hooks/useFireSummary";
import { useHistory } from "@/store/history";
import { useSettings } from "@/store/settings";
import { useAfterTaxReturn, useCurrentProjection } from "@/store/derived";

interface Mark {
  age: number;
  label: string;
  /** Secondary marks hide on narrow screens. */
  minor?: boolean;
  tone?: "ink" | "flame";
}

/** One point a reader can land on: a recorded snapshot or a projected year. */
interface Point {
  kind: "recorded" | "projected";
  age: number;
  /** The date for a recorded point, the calendar year for a projected one. */
  when: string;
  netWorth: number;
  debt: number;
}

interface AxisLabel {
  pct: number;
  text: string;
  align: "left" | "center" | "right";
}

const W = 1000;
const H = 240;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

/** Gap between the inspected point and the card that reads it out. */
const CARD_GAP = 14;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toPath = (coords: [number, number][]): string =>
  coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

/**
 * The journey: net worth across the rest of a life, with the moments that
 * matter marked on it. What has been recorded is drawn as the record, and the
 * projection takes over from today. The one horizontal line is the target; the
 * part of the path that clears it is lit. Point, drag, or arrow along it to
 * read any year.
 */
export function JourneyBand() {
  const projection = useCurrentProjection();
  const snapshots = useHistory((s) => s.snapshots);
  const summary = useFireSummary();
  const settings = useSettings((s) => s.settings);
  const afterTax = useAfterTaxReturn();
  const currency = settings.displayCurrency;
  const clipId = useId();

  const bandRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const targetLabelRef = useRef<HTMLSpanElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  /** Row each mark label sits on, chosen from measured widths. */
  const [labelRows, setLabelRows] = useState<number[]>([]);
  /** Rendered width of the band, so axis labels can keep clear of each other. */
  const [bandWidth, setBandWidth] = useState(0);

  /** Index of the point under inspection, if any. */
  const [active, setActive] = useState<number | null>(null);
  /** A touch reading stays up after the finger lifts, until a tap elsewhere. */
  const [held, setHeld] = useState(false);
  const [card, setCard] = useState({ left: 0, top: 0, coversTarget: false });

  const model = useMemo(() => {
    if (projection.length < 2) return null;

    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.slice(0, 10);
    const thisYear = now.getFullYear();

    // The record: every snapshot before today, placed by how long ago it was.
    // Today's own reading is the live figure the projection starts from.
    const recorded: Point[] = [...snapshots]
      .filter((s) => s.date.slice(0, 10) < today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        kind: "recorded",
        age: settings.currentAge - yearsBetween(s.date, nowIso),
        when: format(parseISO(s.date), "d MMM yyyy"),
        netWorth: convert(s.netWorth, s.currency, currency, settings.usdToNzd),
        debt: convert(
          s.liabilitiesTotal,
          s.currency,
          currency,
          settings.usdToNzd,
        ),
      }));
    const projected: Point[] = projection.map((p) => ({
      kind: "projected",
      age: p.age,
      when: String(thisYear + p.year),
      netWorth: p.netWorth,
      debt: p.debt,
    }));
    const points = [...recorded, ...projected];
    const todayIndex = recorded.length;

    const minAge = points[0].age;
    const maxAge = points[points.length - 1].age;
    const span = Math.max(1, maxAge - minAge);

    const values = points.map((p) => p.netWorth);
    const maxValue = Math.max(summary.target, ...values);
    const minValue = Math.min(0, ...values);
    const top = maxValue * 1.08 || 1;
    const range = top - minValue || 1;

    const x = (age: number) => ((age - minAge) / span) * W;
    const y = (v: number) =>
      PAD_TOP + (1 - (v - minValue) / range) * (H - PAD_TOP - PAD_BOTTOM);
    const coords = (list: Point[]): [number, number][] =>
      list.map((p) => [x(p.age), y(p.netWorth)]);

    const baselineY = y(minValue);
    const close = (list: Point[]) =>
      ` L${x(list[list.length - 1].age).toFixed(1)},${baselineY.toFixed(1)} L${x(list[0].age).toFixed(1)},${baselineY.toFixed(1)} Z`;

    const line = toPath(coords(points));
    const area = line + close(points);
    // The record runs up to today's live figure.
    const recordedPoints = recorded.length ? [...recorded, projected[0]] : null;
    const recordedLine = recordedPoints ? toPath(coords(recordedPoints)) : null;
    const recordedArea =
      recordedPoints && recordedLine
        ? recordedLine + close(recordedPoints)
        : null;

    const targetY = y(summary.target);
    const todayX = x(settings.currentAge);
    const todayPct = (todayX / W) * 100;

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
    if (
      settings.retirementAge > settings.currentAge &&
      settings.retirementAge < maxAge
    ) {
      marks.push({ age: settings.retirementAge, label: "Stop work" });
    }
    if (debtFree !== null && debtFree > settings.currentAge) {
      marks.push({ age: debtFree, label: "Debt free", minor: true });
    }

    const unlock = settings.kiwisaverUnlockAge;
    const pension = settings.nzSuperStartAge;
    const ahead = (age: number) => age > settings.currentAge && age < maxAge;

    if (unlock === pension && ahead(unlock)) {
      marks.push({ age: unlock, label: "KiwiSaver and NZ Super", minor: true });
    } else {
      if (ahead(unlock)) {
        marks.push({ age: unlock, label: "KiwiSaver unlocks", minor: true });
      }
      if (ahead(pension)) {
        marks.push({ age: pension, label: "NZ Super starts", minor: true });
      }
    }

    marks.sort((a, b) => a.age - b.age);

    const laid = marks.map((m) => ({
      ...m,
      pct: ((m.age - minAge) / span) * 100,
    }));

    const firePoint =
      summary.age !== null && !summary.reached
        ? { x: x(summary.age), y: targetY }
        : null;

    return {
      points,
      todayIndex,
      line,
      area,
      recordedLine,
      recordedArea,
      targetY,
      baselineY,
      x,
      y,
      marks: laid,
      minAge,
      maxAge,
      span,
      firePoint,
      today: { x: todayX, y: y(projected[0].netWorth) },
      todayPct,
      recordedSince: recorded[0]?.when ?? null,
      peak: Math.max(...values),
    };
  }, [projection, snapshots, summary, settings, afterTax, currency]);

  const points = model?.points ?? [];
  const last = points.length - 1;
  const reading = active === null ? null : (points[active] ?? null);

  /** The point nearest to a horizontal position on the band. */
  const indexAt = useCallback(
    (clientX: number): number => {
      const band = bandRef.current;

      if (!band || !model) return 0;

      const rect = band.getBoundingClientRect();
      const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
      const age = model.minAge + frac * model.span;

      let best = 0;
      let bestDistance = Infinity;

      points.forEach((p, i) => {
        const distance = Math.abs(p.age - age);

        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });

      return best;
    },
    [model, points],
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setActive(indexAt(e.clientX));
    setHeld(e.pointerType !== "mouse");
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // A mouse reads on hover; a finger reads only while it is down, so a
    // vertical scroll that starts on the band doesn't light it up.
    if (e.pointerType !== "mouse" && e.buttons === 0) return;
    setActive(indexAt(e.clientX));
  };

  const handlePointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") setActive(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? model?.todayIndex ?? 0;
    const move = (to: number) => {
      e.preventDefault();
      setActive(clamp(to, 0, last));
    };

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        move(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        move(current - 1);
        break;
      case "PageUp":
        move(current + 10);
        break;
      case "PageDown":
        move(current - 10);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(last);
        break;
      case "Escape":
        setActive(null);
        setHeld(false);
        break;
    }
  };

  // A reading left up by touch clears on the next tap anywhere else.
  useEffect(() => {
    if (!held || active === null) return;

    const dismiss = (e: globalThis.PointerEvent) => {
      if (bandRef.current?.contains(e.target as Node)) return;
      setActive(null);
      setHeld(false);
    };

    document.addEventListener("pointerdown", dismiss);

    return () => document.removeEventListener("pointerdown", dismiss);
  }, [held, active]);

  useLayoutEffect(() => {
    const band = bandRef.current;

    if (!band) return;

    const update = () => setBandWidth(band.clientWidth);

    update();

    const observer = new ResizeObserver(update);

    observer.observe(band);

    return () => observer.disconnect();
  }, [model]);

  // The age axis: where the record starts, today, every round decade with
  // room for its label, and the horizon.
  const axis = useMemo((): AxisLabel[] => {
    if (!model) return [];

    const px = (pct: number) => (pct / 100) * bandWidth;
    const hasRecord = model.todayIndex > 0;
    const todayX = px(model.todayPct);
    const todayAtEdge = todayX < 24;
    // Pinned to the edge, the label's centre sits to the right of its mark.
    const todayCentre = todayAtEdge ? todayX + 20 : todayX;
    const startShown = hasRecord && todayX > 64;
    const labels: AxisLabel[] = [];

    if (startShown) {
      labels.push({
        pct: 0,
        text: `Age ${Math.round(model.minAge)}`,
        align: "left",
      });
    }
    labels.push({
      pct: model.todayPct,
      text: hasRecord ? "Today" : `Age ${settings.currentAge}`,
      align: todayAtEdge ? "left" : "center",
    });
    for (
      let age = Math.ceil(model.minAge / 10) * 10;
      age <= model.maxAge;
      age += 10
    ) {
      const pct = ((age - model.minAge) / model.span) * 100;
      const centre = px(pct);
      const crowded =
        centre < (startShown ? 64 : 24) ||
        centre > bandWidth - 36 ||
        Math.abs(centre - todayCentre) < 44;

      if (!crowded) labels.push({ pct, text: String(age), align: "center" });
    }
    labels.push({ pct: 100, text: String(model.maxAge), align: "right" });

    return labels;
  }, [model, bandWidth, settings.currentAge]);

  // Stack mark labels on as few rows as their measured widths allow, so
  // neighbours never overlap at any width. Hidden labels take no room.
  useLayoutEffect(() => {
    const container = labelsRef.current;

    if (!container || !model) return;

    const layout = () => {
      const width = container.clientWidth;

      if (!width) return;

      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>("[data-mark]"),
      );
      const rowRight: number[] = [];
      const rows = nodes.map((node) => {
        const w = node.offsetWidth;

        if (!w) return 0;

        const centre = (Number(node.dataset.mark) / 100) * width;
        const left = centre - w / 2;
        let row = rowRight.findIndex((right) => left >= right + 12);

        if (row === -1) row = rowRight.length;
        rowRight[row] = centre + w / 2;

        return row;
      });

      setLabelRows((prev) =>
        prev.length === rows.length && prev.every((r, i) => r === rows[i])
          ? prev
          : rows,
      );
    };

    layout();

    const observer = new ResizeObserver(layout);

    observer.observe(container);

    return () => observer.disconnect();
  }, [model]);

  // Keep the card inside the band: beside the point, flipping to the other
  // side near the right edge, and below the point when the curve is high.
  useLayoutEffect(() => {
    const band = bandRef.current;
    const box = cardRef.current;

    if (!band || !box || !model || !reading) return;

    const width = band.clientWidth;
    const height = band.clientHeight;
    const px = (model.x(reading.age) / W) * width;
    const py = (model.y(reading.netWorth) / H) * height;

    let left = px + CARD_GAP;

    if (left + box.offsetWidth > width) left = px - CARD_GAP - box.offsetWidth;
    left = clamp(left, 0, Math.max(0, width - box.offsetWidth));

    let top = py - box.offsetHeight - CARD_GAP;

    if (top < 0) top = py + CARD_GAP;
    top = clamp(top, 0, Math.max(0, height - box.offsetHeight));

    // The target label steps aside rather than peeking out from under it.
    const label = targetLabelRef.current;
    const coversTarget =
      !!label &&
      left + box.offsetWidth > label.offsetLeft &&
      top < label.offsetTop + label.offsetHeight &&
      top + box.offsetHeight > label.offsetTop;

    setCard({ left, top, coversTarget });
  }, [model, reading]);

  if (!model) return null;

  const { marks } = model;
  const rows = Math.max(1, ...labelRows.map((r) => r + 1));
  const hasTarget = summary.target > 0;
  const lit =
    reading !== null && hasTarget && reading.netWorth >= summary.target;
  const gap = reading === null ? 0 : reading.netWorth - summary.target;

  const valueText =
    reading === null
      ? undefined
      : reading.kind === "recorded"
        ? `Recorded ${reading.when}, ${formatMoney(reading.netWorth, currency)}`
        : `Age ${reading.age}, ${formatMoney(reading.netWorth, currency)}`;

  return (
    <figure className="select-none">
      {/* Labels above the band. */}
      <div
        ref={labelsRef}
        className="relative mb-1 hidden sm:block"
        style={{ height: rows * 22 + 6 }}
      >
        {marks.map((m, i) => (
          <div
            key={`${m.label}-${m.age}`}
            className={clsx(
              "absolute flex -translate-x-1/2 flex-col items-center",
              m.minor && "hidden md:flex",
            )}
            data-mark={m.pct}
            style={{ left: `${m.pct}%`, top: (labelRows[i] ?? 0) * 22 }}
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

      <div ref={bandRef} className="relative">
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
          {/* The record sits heavier on the page than what is projected. */}
          {model.recordedArea && (
            <path d={model.recordedArea} fill="var(--ink)" opacity={0.1} />
          )}
          <path
            d={model.line}
            fill="none"
            stroke="var(--ink)"
            strokeLinejoin="round"
            strokeWidth={1.75}
            vectorEffect="non-scaling-stroke"
          />
          {model.recordedLine && (
            <path
              d={model.recordedLine}
              fill="none"
              stroke="var(--ink)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.75}
              vectorEffect="non-scaling-stroke"
            />
          )}
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

          {/* The point under inspection. */}
          {reading && (
            <line
              stroke="var(--ink)"
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
              x1={model.x(reading.age)}
              x2={model.x(reading.age)}
              y1={0}
              y2={model.baselineY}
            />
          )}
        </svg>

        {/* Points live outside the stretched SVG so they stay round. */}
        <span
          aria-hidden
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-[3px] ring-[color:var(--bg)]"
          style={{
            left: `${(model.today.x / W) * 100}%`,
            top: `${(model.today.y / H) * 100}%`,
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
        {reading && (
          <span
            aria-hidden
            className={clsx(
              "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-[color:var(--bg)]",
              lit ? "bg-flame" : "bg-ink",
            )}
            style={{
              left: `${(model.x(reading.age) / W) * 100}%`,
              top: `${(model.y(reading.netWorth) / H) * 100}%`,
            }}
          />
        )}

        {/* Target label, pinned to the line's right end. */}
        <span
          ref={targetLabelRef}
          className={clsx(
            "num absolute right-0 -translate-y-full pb-1 text-[12px] text-flame-ink transition-opacity duration-[var(--dur-hover)]",
            reading && card.coversTarget && "opacity-0",
          )}
          style={{ top: `${(model.targetY / H) * 100}%` }}
        >
          Target {formatMoneyCompact(summary.target, currency)}
        </span>

        {/* The reading. */}
        {reading && (
          <div
            ref={cardRef}
            aria-hidden
            className="pointer-events-none absolute z-10 w-max min-w-[150px] rounded-lg border border-line-soft bg-surface px-3 py-2 shadow-pop"
            style={{ left: card.left, top: card.top }}
          >
            <div className="num flex items-baseline justify-between gap-5 text-[13px] text-ink-3">
              <span>
                {reading.kind === "recorded"
                  ? "Recorded"
                  : `Age ${reading.age}`}
              </span>
              <span>{reading.when}</span>
            </div>
            <div className="num mt-0.5 text-[15px] font-medium text-ink">
              {formatMoney(reading.netWorth, currency)}
            </div>
            {hasTarget && (
              <div
                className={clsx(
                  "num mt-0.5 text-[12.5px]",
                  lit ? "text-flame-ink" : "text-ink-3",
                )}
              >
                {lit
                  ? `${formatMoneyCompact(gap, currency)} clear of the target`
                  : `${formatMoneyCompact(-gap, currency)} short of the target`}
              </div>
            )}
            {reading.debt > 0 && (
              <div className="num mt-1.5 flex items-baseline justify-between gap-5 border-t border-line-soft pt-1.5 text-[12.5px]">
                <span className="text-ink-3">Debt owing</span>
                <span className="text-ink-2">
                  {formatMoney(reading.debt, currency)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* The hit area: pointer, touch and keyboard all read through it. */}
        <div
          aria-label="Net worth by age, recorded and projected"
          aria-orientation="horizontal"
          aria-valuemax={model.maxAge}
          aria-valuemin={Math.round(model.minAge)}
          aria-valuenow={Math.round(reading?.age ?? settings.currentAge)}
          aria-valuetext={valueText}
          className="absolute inset-0 cursor-crosshair touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--bg)]"
          role="slider"
          tabIndex={0}
          onBlur={() => {
            if (!held) setActive(null);
          }}
          onFocus={() => setActive((i) => i ?? model.todayIndex)}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
        />
      </div>

      {/* Age axis */}
      <div className="num relative mt-1.5 h-4 text-[11.5px] text-ink-3">
        {axis.map((label) => (
          <span
            key={`${label.text}-${label.pct}`}
            className={clsx(
              "absolute whitespace-nowrap",
              label.align === "center" && "-translate-x-1/2",
              label.align === "right" && "-translate-x-full",
            )}
            style={{ left: `${label.pct}%` }}
          >
            {label.text}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        {model.recordedSince
          ? `Net worth recorded since ${model.recordedSince}, then projected to age ${model.maxAge}, peaking at ${formatMoneyCompact(model.peak, currency)}.`
          : `Projected net worth from age ${settings.currentAge} to ${model.maxAge}, peaking at ${formatMoneyCompact(model.peak, currency)}.`}{" "}
        Use the arrow keys on the chart to read any point.
      </figcaption>
    </figure>
  );
}
