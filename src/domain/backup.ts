import type {
  Asset,
  Expense,
  IncomeSource,
  Kid,
  Liability,
  LifeEvent,
  Scenario,
  Settings,
} from "@/types";
import type { NetWorthSnapshot } from "@/store/history";

/**
 * Everything a backup round-trips. Each list is optional so a file written by
 * an older version still restores what it does contain.
 */
export interface BackupPayload {
  settings?: Partial<Settings>;
  assets?: Asset[];
  liabilities?: Liability[];
  income?: IncomeSource[];
  expenses?: Expense[];
  events?: LifeEvent[];
  kids?: Kid[];
  scenarios?: Scenario[];
  history?: NetWorthSnapshot[];
}

export interface BackupSummary {
  assets: number;
  liabilities: number;
  income: number;
  expenses: number;
  events: number;
  kids: number;
  scenarios: number;
  history: number;
  hasSettings: boolean;
  generatedAt?: string;
}

export type ImportResult =
  | { ok: true; payload: BackupPayload; summary: BackupSummary }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isCurrency = (value: unknown): boolean =>
  value === "NZD" || value === "USD";

/**
 * Keep only the entries that actually look like `T`.
 *
 * A backup file is untrusted input — it may be hand-edited, truncated, or from
 * a different version. Dropping bad rows rather than rejecting the whole file
 * means one malformed asset doesn't cost the user their entire restore, and
 * nothing malformed reaches the stores.
 */
const collect = <T>(
  value: unknown,
  isValid: (item: Record<string, unknown>) => boolean,
): T[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is T =>
      isRecord(item) && typeof item.id === "string" && isValid(item),
  );
};

const validAsset = (a: Record<string, unknown>): boolean =>
  typeof a.name === "string" &&
  isFiniteNumber(a.value) &&
  isCurrency(a.currency) &&
  isFiniteNumber(a.contribution);

const validLiability = (l: Record<string, unknown>): boolean =>
  typeof l.name === "string" &&
  isFiniteNumber(l.balance) &&
  isCurrency(l.currency) &&
  isFiniteNumber(l.interestRate) &&
  isFiniteNumber(l.payment);

const validIncome = (i: Record<string, unknown>): boolean =>
  typeof i.name === "string" &&
  isFiniteNumber(i.amount) &&
  isCurrency(i.currency);

const validExpense = (e: Record<string, unknown>): boolean =>
  typeof e.name === "string" &&
  isFiniteNumber(e.amount) &&
  isCurrency(e.currency);

const validEvent = (e: Record<string, unknown>): boolean =>
  typeof e.name === "string" &&
  isFiniteNumber(e.amount) &&
  isFiniteNumber(e.year) &&
  isCurrency(e.currency);

const validKid = (k: Record<string, unknown>): boolean =>
  typeof k.name === "string" && isFiniteNumber(k.birthYear);

const validScenario = (s: Record<string, unknown>): boolean =>
  typeof s.name === "string" && isRecord(s.inputs);

const validSnapshot = (s: Record<string, unknown>): boolean =>
  typeof s.date === "string" && isFiniteNumber(s.netWorth);

/**
 * Numeric settings that would break the projection if they arrived as strings
 * or NaN. Anything not listed passes through as-is.
 */
const NUMERIC_SETTINGS = [
  "currentAge",
  "retirementAge",
  "annualExpenses",
  "withdrawalRate",
  "expectedReturn",
  "inflationRate",
  "nzSuperAnnual",
  "nzSuperStartAge",
  "kiwisaverUnlockAge",
  "usdToNzd",
  "retirementExpenses",
  "pirOverride",
] as const;

const cleanSettings = (value: unknown): Partial<Settings> | undefined => {
  if (!isRecord(value)) return undefined;

  const cleaned: Record<string, unknown> = { ...value };

  for (const key of NUMERIC_SETTINGS) {
    if (key in cleaned && !isFiniteNumber(cleaned[key])) delete cleaned[key];
  }

  if (!isCurrency(cleaned.displayCurrency)) delete cleaned.displayCurrency;

  return cleaned as Partial<Settings>;
};

/**
 * Parse a backup file produced by the exporter.
 *
 * Accepts both the current shape and the older one that nested everything
 * under the keys the exporter happened to spread, so earlier backups still
 * restore.
 */
export const parseBackup = (raw: string): ImportResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That doesn't look like JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "Expected a JSON object at the top level." };
  }

  const payload: BackupPayload = {
    settings: cleanSettings(parsed.settings),
    assets: collect<Asset>(parsed.assets, validAsset),
    liabilities: collect<Liability>(parsed.liabilities, validLiability),
    income: collect<IncomeSource>(parsed.income, validIncome),
    expenses: collect<Expense>(parsed.expenses, validExpense),
    events: collect<LifeEvent>(parsed.events, validEvent),
    kids: collect<Kid>(parsed.kids, validKid),
    scenarios: collect<Scenario>(parsed.scenarios, validScenario),
    history: collect<NetWorthSnapshot>(parsed.history, validSnapshot),
  };

  const summary: BackupSummary = {
    assets: payload.assets?.length ?? 0,
    liabilities: payload.liabilities?.length ?? 0,
    income: payload.income?.length ?? 0,
    expenses: payload.expenses?.length ?? 0,
    events: payload.events?.length ?? 0,
    kids: payload.kids?.length ?? 0,
    scenarios: payload.scenarios?.length ?? 0,
    history: payload.history?.length ?? 0,
    hasSettings: payload.settings !== undefined,
    generatedAt:
      typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
  };

  const total =
    summary.assets +
    summary.liabilities +
    summary.income +
    summary.expenses +
    summary.events +
    summary.kids +
    summary.scenarios +
    summary.history;

  if (total === 0 && !summary.hasSettings) {
    return {
      ok: false,
      error: "No recognisable data in that file — nothing would be restored.",
    };
  }

  return { ok: true, payload, summary };
};
