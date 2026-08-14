import { Baby, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useState } from "react";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import {
  KID_COST_BANDS,
  KID_INDEPENDENT_AGE,
  kidCostAtAge,
} from "@/domain/kids";
import { useSettings } from "@/store/settings";
import { useExpenses } from "@/store/expenses";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function KidsCard() {
  const kids = useExpenses((s) => s.kids);
  const upsertKid = useExpenses((s) => s.upsertKid);
  const removeKid = useExpenses((s) => s.removeKid);
  const settings = useSettings((s) => s.settings);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());

  const display = settings.displayCurrency;
  const thisYear = new Date().getFullYear();
  const toDisplay = (nzd: number) =>
    convert(nzd, "NZD", display, settings.usdToNzd);

  const add = () => {
    if (!name.trim()) return;
    upsertKid({ name: name.trim(), birthYear });
    setName("");
    setBirthYear(thisYear);
  };

  const totalThisYear = kids.reduce(
    (sum, kid) => sum + kidCostAtAge(thisYear - kid.birthYear),
    0,
  );

  return (
    <Card eyebrow="Dependants" title="Kids">
      <div className="space-y-5">
        {kids.length === 0 ? (
          <EmptyState
            description={`Costs follow the child's age rather than a flat yearly figure — childcare early, then school, then any study support, ending at ${KID_INDEPENDENT_AGE}.`}
            icon={Baby}
            title="No kids recorded"
          />
        ) : (
          <div className="space-y-2">
            {kids.map((kid) => {
              const age = thisYear - kid.birthYear;
              const cost = kidCostAtAge(age);

              return (
                <div
                  key={kid.id}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-ink-300">
                    <Baby className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {kid.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-400">
                      {age < 0
                        ? `Arriving ${kid.birthYear}`
                        : `Age ${age} · born ${kid.birthYear}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular text-sm font-semibold">
                      {cost > 0 ? formatMoney(toDisplay(cost), display) : "—"}
                    </div>
                    <div className="text-[10px] text-ink-500">
                      {cost > 0
                        ? "this year"
                        : age < 0
                          ? "not yet"
                          : "independent"}
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${kid.name}`}
                    className="rounded-md p-1.5 text-ink-400 transition hover:bg-white/5 hover:text-loss"
                    onClick={() => removeKid(kid.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-white/5 pt-3 text-sm">
              <span className="text-ink-300">Total this year</span>
              <span className="font-mono tabular font-semibold text-white">
                {formatMoney(toDisplay(totalThisYear), display)}
              </span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Add a kid
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              classNames={{
                base: "flex-1 min-w-[140px]",
                inputWrapper:
                  "border border-white/[0.08] bg-white/[0.02] data-[hover=true]:border-white/15",
              }}
              placeholder="Name"
              size="sm"
              value={name}
              variant="bordered"
              onValueChange={setName}
            />
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Earlier birth year"
                className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white"
                onClick={() => setBirthYear((y) => y - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono tabular w-12 text-center text-sm font-semibold">
                {birthYear}
              </span>
              <button
                aria-label="Later birth year"
                className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-300 transition hover:border-white/10 hover:text-white"
                onClick={() => setBirthYear((y) => y + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              className="bg-accent text-white"
              isDisabled={!name.trim()}
              size="sm"
              onPress={add}
            >
              Add
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">
            A future year models a kid you&apos;re planning for.
          </p>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Cost by age
          </div>
          <div className="space-y-1.5">
            {KID_COST_BANDS.map((band, index) => {
              const from = index === 0 ? 0 : KID_COST_BANDS[index - 1].untilAge;

              return (
                <div
                  key={band.label}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-ink-400">
                    {band.label}{" "}
                    <span className="text-ink-600">
                      ({from}–{band.untilAge - 1})
                    </span>
                  </span>
                  <span className="font-mono tabular text-ink-300">
                    {formatMoney(toDisplay(band.annualNzd), display)}/yr
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
