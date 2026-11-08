#!/usr/bin/env node
/**
 * Refreshes src/data/sp500.json: the S&P 500 total return index and the
 * USD/NZD rate for every US trading day since 2010.
 *
 * The app is static and these prices cannot be fetched from a browser, so the
 * history ships with the build. Writes nothing unless the download passes
 * every check, so a bad response leaves the last good data in place.
 */
import { readFile, writeFile } from "node:fs/promises";

const OUTPUT = new URL("../src/data/sp500.json", import.meta.url);
const SINCE = Date.UTC(2010, 0, 1) / 1000;
const MINIMUM_POINTS = 4000;
/** Bigger one-day moves than these are bad ticks, not markets. */
const MAX_DAILY_INDEX_MOVE = 0.15;
const MAX_DAILY_FX_MOVE = 0.1;
/** The index should have closed within this many days of a refresh. */
const MAX_STALE_DAYS = 10;

const dayOf = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

async function fetchCloses(symbol) {
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${SINCE}&period2=${now}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);

  const body = await res.json();
  const result = body?.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!result?.timestamp || !closes) {
    throw new Error(`${symbol}: unexpected response shape`);
  }

  // Today's bar is still moving, so only finished days are kept.
  const today = dayOf(now);

  return result.timestamp
    .map((t, i) => ({ date: dayOf(t), close: closes[i] }))
    .filter((p) => Number.isFinite(p.close) && p.date < today);
}

/** The FX rate on each index date: that day's, or the last one before it. */
function alignRates(index, rates) {
  const aligned = [];
  let cursor = 0;

  for (const { date } of index) {
    while (cursor + 1 < rates.length && rates[cursor + 1].date <= date) {
      cursor += 1;
    }
    if (rates[cursor].date > date) {
      throw new Error(`No USD/NZD rate on or before ${date}`);
    }
    aligned.push(rates[cursor].close);
  }

  return aligned;
}

function assertSound(dates, usd, usdToNzd) {
  if (dates.length < MINIMUM_POINTS) {
    throw new Error(`Only ${dates.length} points`);
  }

  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i - 1]) {
      throw new Error(`Dates out of order at ${dates[i]}`);
    }
    if (Math.abs(usd[i] / usd[i - 1] - 1) > MAX_DAILY_INDEX_MOVE) {
      throw new Error(`Index jumped on ${dates[i]}`);
    }
    if (Math.abs(usdToNzd[i] / usdToNzd[i - 1] - 1) > MAX_DAILY_FX_MOVE) {
      throw new Error(`USD/NZD jumped on ${dates[i]}`);
    }
  }

  const age = (Date.now() - Date.parse(dates[dates.length - 1])) / 86_400_000;

  if (age > MAX_STALE_DAYS) {
    throw new Error(`Latest close is ${Math.round(age)} days old`);
  }
}

const [index, rates] = await Promise.all([
  fetchCloses("^SP500TR"),
  fetchCloses("NZD=X"),
]);

const dates = index.map((p) => p.date);
const usd = index.map((p) => Math.round(p.close * 100) / 100);
const usdToNzd = alignRates(index, rates).map(
  (r) => Math.round(r * 10000) / 10000,
);

assertSound(dates, usd, usdToNzd);

// One short line per column keeps the file diffable and small.
const output = `{
"source": "Yahoo Finance: ^SP500TR and NZD=X daily closes",
"dates": ${JSON.stringify(dates)},
"usd": ${JSON.stringify(usd)},
"usdToNzd": ${JSON.stringify(usdToNzd)}
}
`;

const previous = await readFile(OUTPUT, "utf8").catch(() => null);

if (previous === output) {
  console.log("Benchmark data already current");
} else {
  await writeFile(OUTPUT, output);
  console.log(
    `Wrote ${dates.length} points, ${dates[0]} to ${dates[dates.length - 1]}`,
  );
}
