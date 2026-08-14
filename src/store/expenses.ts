import type { Expense, Kid, LifeEvent } from "@/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExpensesState {
  expenses: Expense[];
  events: LifeEvent[];
  kids: Kid[];
  upsertExpense: (
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  removeExpense: (id: string) => void;
  upsertEvent: (
    event: Omit<LifeEvent, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  removeEvent: (id: string) => void;
  upsertKid: (
    kid: Omit<Kid, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  removeKid: (id: string) => void;
  reset: () => void;
}

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Insert or update by id, stamping timestamps. Shared by all three lists. */
const upsertInto = <
  T extends { id: string; createdAt: string; updatedAt: string },
>(
  list: T[],
  incoming: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
): T[] => {
  const now = new Date().toISOString();
  const existing = incoming.id
    ? list.find((item) => item.id === incoming.id)
    : undefined;

  if (existing) {
    return list.map((item) =>
      item.id === existing.id
        ? { ...existing, ...incoming, id: existing.id, updatedAt: now }
        : item,
    );
  }

  return [
    ...list,
    { ...incoming, id: newId(), createdAt: now, updatedAt: now } as T,
  ];
};

export const useExpenses = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      events: [],
      kids: [],
      upsertExpense: (expense) =>
        set({ expenses: upsertInto(get().expenses, expense) }),
      removeExpense: (id) =>
        set({ expenses: get().expenses.filter((e) => e.id !== id) }),
      upsertEvent: (event) => set({ events: upsertInto(get().events, event) }),
      removeEvent: (id) =>
        set({ events: get().events.filter((e) => e.id !== id) }),
      upsertKid: (kid) => set({ kids: upsertInto(get().kids, kid) }),
      removeKid: (id) => set({ kids: get().kids.filter((k) => k.id !== id) }),
      reset: () => set({ expenses: [], events: [], kids: [] }),
    }),
    {
      name: "fire.expenses.v1",
      version: 1,
    },
  ),
);
