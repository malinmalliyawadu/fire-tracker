import type { LifeEvent } from "@/types";

import { CalendarClock, Pencil } from "lucide-react";
import { Button } from "@heroui/button";
import { useState } from "react";

import { LifeEventEditor } from "./LifeEventEditor";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useExpenses } from "@/store/expenses";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function LifeEventsCard() {
  const events = useExpenses((s) => s.events);
  const settings = useSettings((s) => s.settings);
  const [editing, setEditing] = useState<LifeEvent | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const thisYear = new Date().getFullYear();

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (event: LifeEvent) => {
    setEditing(event);
    setOpen(true);
  };

  const sorted = [...events].sort((a, b) => a.year - b.year);

  return (
    <Card
      action={
        <Button className="bg-accent text-white" size="sm" onPress={startAdd}>
          + Add event
        </Button>
      }
      eyebrow="One-offs"
      title="Life events"
    >
      {events.length === 0 ? (
        <EmptyState
          action={
            <Button
              className="bg-accent text-white"
              size="sm"
              onPress={startAdd}
            >
              Add an event
            </Button>
          }
          description="A house deposit, a car replacement, a big trip, an inheritance — the lumpy things a flat annual figure can't capture."
          icon={CalendarClock}
          title="No events planned"
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((event) => {
            const amount = convert(
              event.amount,
              event.currency,
              display,
              settings.usdToNzd,
            );
            const isWindfall = amount < 0;
            const age = settings.currentAge + (event.year - thisYear);
            const isPast = event.year < thisYear;

            return (
              <div
                key={event.id}
                className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-ink-300">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {event.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-400">
                    {event.year} · age {age}
                    {isPast && (
                      <span className="ml-1.5 text-amber-400/80">
                        in the past, not projected
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={
                    "font-mono tabular text-sm font-semibold " +
                    (isWindfall ? "text-gain" : "text-loss")
                  }
                >
                  {isWindfall ? "+" : "-"}
                  {formatMoney(Math.abs(amount), display)}
                </div>
                <button
                  aria-label={`Edit ${event.name}`}
                  className="rounded-md p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                  onClick={() => startEdit(event)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <LifeEventEditor
        event={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}
