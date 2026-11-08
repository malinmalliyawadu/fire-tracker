#!/usr/bin/env node
/**
 * Refreshes the history the Performance page measures against.
 *
 * - src/data/markets.json: daily closes for the S&P 500 total return index,
 *   world shares (VT, dividends reinvested) and USD/NZD since 2010.
 * - src/data/nz-rates.json: New Zealand consumer prices and the 90-day bank
 *   rate, compounded into a level, from the OECD.
 *
 * The app is static and browsers cannot fetch these, so the history ships with
 * the build. Each file is written only if its download passes every check, so
 * a bad response leaves the last good data in place.
 */
import { readFile, writeFile } from "node:fs/promises";

const MARKETS = new URL("../src/data/markets.json", import.meta.url);
const NZ_RATES = new URL("../src/data/nz-rates.json", import.meta.url);
const SINCE = Date.UTC(2010, 0, 1) / 1000;
const MINIMUM_POINTS = 4000;
/** Bigger one-day moves than these are bad ticks, not markets. */
const MAX_DAILY_INDEX_MOVE = 0.15;
const MAX_DAILY_FX_MOVE = 0.1;
/** The index should have closed within this many days of a refresh. */
const MAX_STALE_DAYS = 10;
/** Official NZ figures arrive late: a quarter's CPI, a month's rates. */
const MAX_STALE_CPI_DAYS = 200;
const MAX_STALE_CASH_DAYS = 100;
const MIN_CPI_QUARTERS = 60;
const MIN_CASH_MONTHS = 180;
const MAX_QUARTERLY_CPI_MOVE = 0.05;
const MAX_CASH_RATE = 15;
const OECD_ATTEMPTS = 4;
const OECD_RETRY_MS = 5000;

const DAY_MS = 86_400_000;
const dayOf = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);
const ageInDays = (date) => (Date.now() - Date.parse(date)) / DAY_MS;

/** Daily closes for a symbol; `adjusted` includes reinvested dividends. */
async function fetchCloses(symbol, { adjusted = false } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${SINCE}&period2=${now}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);

  const body = await res.json();
  const result = body?.chart?.result?.[0];
  const closes = adjusted
    ? result?.indicators?.adjclose?.[0]?.adjclose
    : result?.indicators?.quote?.[0]?.close;

  if (!result?.timestamp || !closes) {
    throw new Error(`${symbol}: unexpected response shape`);
  }

  // Today's bar is still moving, so only finished days are kept.
  const today = dayOf(now);

  return result.timestamp
    .map((t, i) => ({ date: dayOf(t), close: closes[i] }))
    .filter((p) => Number.isFinite(p.close) && p.date < today);
}

/** Each series' value on the index's dates: that day's, or the last before. */
function align(index, series, name) {
  const aligned = [];
  let cursor = 0;

  for (const { date } of index) {
    while (cursor + 1 < series.length && series[cursor + 1].date <= date) {
      cursor += 1;
    }
    if (series[cursor].date > date) {
      throw new Error(`No ${name} value on or before ${date}`);
    }
    aligned.push(series[cursor].close);
  }

  return aligned;
}

function assertMarketsSound(dates, sp500, global, usdToNzd) {
  if (dates.length < MINIMUM_POINTS) {
    throw new Error(`Only ${dates.length} points`);
  }

  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i - 1]) {
      throw new Error(`Dates out of order at ${dates[i]}`);
    }
    if (Math.abs(sp500[i] / sp500[i - 1] - 1) > MAX_DAILY_INDEX_MOVE) {
      throw new Error(`S&P 500 jumped on ${dates[i]}`);
    }
    if (Math.abs(global[i] / global[i - 1] - 1) > MAX_DAILY_INDEX_MOVE) {
      throw new Error(`World shares jumped on ${dates[i]}`);
    }
    if (Math.abs(usdToNzd[i] / usdToNzd[i - 1] - 1) > MAX_DAILY_FX_MOVE) {
      throw new Error(`USD/NZD jumped on ${dates[i]}`);
    }
  }

  const age = ageInDays(dates[dates.length - 1]);

  if (age > MAX_STALE_DAYS) {
    throw new Error(`Latest close is ${Math.round(age)} days old`);
  }
}

/** A series from the OECD's data API, oldest first. */
async function fetchOecd(path, startPeriod) {
  const url = `https://sdmx.oecd.org/public/rest/data/${path}?startPeriod=${startPeriod}&dimensionAtObservation=AllDimensions&format=csvfile`;
  let res;

  // The service throws the odd 5xx and rate limits, both gone a moment later.
  for (let attempt = 1; attempt <= OECD_ATTEMPTS; attempt++) {
    res = await fetch(url, { headers: { Accept: "text/csv" } });
    if (res.ok || attempt === OECD_ATTEMPTS) break;
    await new Promise((resolve) => setTimeout(resolve, OECD_RETRY_MS));
  }

  if (!res.ok) throw new Error(`OECD ${path}: HTTP ${res.status}`);

  const [header, ...lines] = (await res.text()).trim().split(/\r?\n/);
  const columns = header.split(",");
  const period = columns.indexOf("TIME_PERIOD");
  const value = columns.indexOf("OBS_VALUE");

  if (period < 0 || value < 0) {
    throw new Error(`OECD ${path}: unexpected columns`);
  }

  return lines
    .map((line) => line.split(","))
    .map((cells) => ({ period: cells[period], value: Number(cells[value]) }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => a.period.localeCompare(b.period));
}

const QUARTER_END = { Q1: "03-31", Q2: "06-30", Q3: "09-30", Q4: "12-31" };

/** CPI level at the end of each quarter. */
function cpiCurve(observations) {
  const dates = observations.map(({ period }) => {
    const [year, quarter] = period.split("-");

    if (!QUARTER_END[quarter]) throw new Error(`Odd quarter ${period}`);

    return `${year}-${QUARTER_END[quarter]}`;
  });
  const level = observations.map((o) => o.value);

  if (dates.length < MIN_CPI_QUARTERS) {
    throw new Error(`Only ${dates.length} CPI quarters`);
  }
  for (let i = 1; i < level.length; i++) {
    if (Math.abs(level[i] / level[i - 1] - 1) > MAX_QUARTERLY_CPI_MOVE) {
      throw new Error(`CPI jumped at ${dates[i]}`);
    }
  }
  if (ageInDays(dates[dates.length - 1]) > MAX_STALE_CPI_DAYS) {
    throw new Error(`Latest CPI is ${dates[dates.length - 1]}`);
  }

  return { dates, level };
}

/** What a dollar on deposit at the bank rate has grown to, month by month. */
function cashCurve(observations) {
  if (observations.length < MIN_CASH_MONTHS) {
    throw new Error(`Only ${observations.length} months of bank rates`);
  }

  const dates = [`${observations[0].period}-01`];
  const level = [1];

  for (const { period, value } of observations) {
    if (value < 0 || value > MAX_CASH_RATE) {
      throw new Error(`Bank rate of ${value} at ${period}`);
    }

    const [year, month] = period.split("-").map(Number);
    const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

    dates.push(next);
    level.push(
      Math.round(level[level.length - 1] * (1 + value / 100) ** (1 / 12) * 1e6) /
        1e6,
    );
  }

  // The last point is the end of the last month reported.
  if (ageInDays(dates[dates.length - 1]) > MAX_STALE_CASH_DAYS) {
    throw new Error(`Latest bank rate is ${dates[dates.length - 1]}`);
  }

  return { dates, level };
}

async function save(file, output, summary) {
  const previous = await readFile(file, "utf8").catch(() => null);

  if (previous === output) {
    console.log(`${summary}: already current`);
  } else {
    await writeFile(file, output);
    console.log(`Wrote ${summary}`);
  }
}

async function updateMarkets() {
  const [index, world, rates] = await Promise.all([
    fetchCloses("^SP500TR"),
    fetchCloses("VT", { adjusted: true }),
    fetchCloses("NZD=X"),
  ]);

  const dates = index.map((p) => p.date);
  const sp500 = index.map((p) => Math.round(p.close * 100) / 100);
  const global = align(index, world, "VT").map(
    (v) => Math.round(v * 100) / 100,
  );
  const usdToNzd = align(index, rates, "USD/NZD").map(
    (r) => Math.round(r * 10000) / 10000,
  );

  assertMarketsSound(dates, sp500, global, usdToNzd);

  // One short line per column keeps the file diffable and small.
  await save(
    MARKETS,
    `{
"source": "Yahoo Finance: ^SP500TR, VT (dividend adjusted) and NZD=X daily closes",
"dates": ${JSON.stringify(dates)},
"sp500": ${JSON.stringify(sp500)},
"global": ${JSON.stringify(global)},
"usdToNzd": ${JSON.stringify(usdToNzd)}
}
`,
    `markets, ${dates.length} points to ${dates[dates.length - 1]}`,
  );
}

async function updateNzRates() {
  // One at a time: the service turns away parallel requests.
  const cpiObservations = await fetchOecd(
    "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/NZL.Q.N.CPI.IX._T.N._Z",
    "2009-Q4",
  );
  const cashObservations = await fetchOecd(
    "OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0/NZL.M.IR3TIB.PA.....",
    "2009-12",
  );
  const cpi = cpiCurve(cpiObservations);
  const cash = cashCurve(cashObservations);

  await save(
    NZ_RATES,
    `{
"source": "OECD: New Zealand CPI (quarterly) and 3-month interbank rate (monthly), compounded",
"cpi": ${JSON.stringify(cpi)},
"cash": ${JSON.stringify(cash)}
}
`,
    `NZ rates, CPI to ${cpi.dates[cpi.dates.length - 1]}, bank rate to ${cash.dates[cash.dates.length - 1]}`,
  );
}

// Independent sources: one failing must not hold back the other.
const results = await Promise.allSettled([updateMarkets(), updateNzRates()]);
const failures = results.filter((r) => r.status === "rejected");

for (const failure of failures) console.error(failure.reason);
if (failures.length > 0) process.exitCode = 1;
