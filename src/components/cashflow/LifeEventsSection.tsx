import type { LifeEvent } from "@/types";

import { CalendarClock, ChevronRight, Plus } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

import { LifeEventEditor } from "./LifeEventEditor";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { useExpenses } from "@/store/expenses";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";

export function LifeEventsSection() {
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
    <Section
      aside={
        <Button icon={Plus} size="sm" variant="primary" onClick={startAdd}>
          Add event
        </Button>
      }
      lede="One-off costs and windfalls, landing in a particular year."
      title="Life events"
    >
      {events.length === 0 ? (
        <EmptyState
          action={
            <Button size="sm" variant="primary" onClick={startAdd}>
              Add an event
            </Button>
          }
          description="A house deposit, a car, a big trip, an inheritance. The lumpy things a flat yearly figure can't hold."
          icon={CalendarClock}
          title="No events planned"
        />
      ) : (
        <ul className="divide-y divide-line-soft">
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
              <li key={event.id}>
                <button
                  aria-label={`Edit ${event.name}`}
                  className="group flex w-full items-center gap-4 rounded-md py-3 text-left transition-colors duration-[var(--dur-hover)] hover:bg-wash"
                  type="button"
                  onClick={() => startEdit(event)}
                >
                  <div className="num w-12 shrink-0">
                    <div className="text-[14.5px] font-medium text-ink">
                      {event.year}
                    </div>
                    <div className="text-[12px] text-ink-3">age {age}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-medium text-ink">
                      {event.name}
                    </div>
                    {(event.notes || isPast) && (
                      <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-ink-3">
                        {event.notes && (
                          <span className="truncate">{event.notes}</span>
                        )}
                        {isPast && <Tag tone="note">Past, not projected</Tag>}
                      </div>
                    )}
                  </div>
                  <div
                    className={clsx(
                      "num shrink-0 text-[14.5px] font-medium",
                      isWindfall ? "text-gain" : "text-ink",
                    )}
                  >
                    {isWindfall ? "+" : "−"}
                    {formatMoney(Math.abs(amount), display)}
                  </div>
                  <ChevronRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-ink-4 transition-[transform,color] duration-[var(--dur-hover)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <LifeEventEditor
        event={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Section>
  );
}
