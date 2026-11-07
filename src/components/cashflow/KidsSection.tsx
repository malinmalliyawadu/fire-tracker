import { Baby, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useId, useState } from "react";

import { convert } from "@/domain/currency";
import { formatMoney } from "@/domain/format";
import {
  KID_COST_BANDS,
  KID_INDEPENDENT_AGE,
  kidCostAtAge,
} from "@/domain/kids";
import { useSettings } from "@/store/settings";
import { useExpenses } from "@/store/expenses";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldLabel, INPUT_FRAME } from "@/components/ui/Field";
import { Section } from "@/components/ui/Section";
import { Stepper } from "@/components/ui/Stepper";

export function KidsSection() {
  const kids = useExpenses((s) => s.kids);
  const upsertKid = useExpenses((s) => s.upsertKid);
  const removeKid = useExpenses((s) => s.removeKid);
  const settings = useSettings((s) => s.settings);
  const [name, setName] = useState("");
  const thisYear = new Date().getFullYear();
  const [birthYear, setBirthYear] = useState(thisYear);
  const nameId = useId();

  const display = settings.displayCurrency;
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
    <Section
      lede={`Costs follow each child's age rather than a flat figure, ending at ${KID_INDEPENDENT_AGE}.`}
      title="Kids"
    >
      <div className="space-y-6">
        {kids.length === 0 ? (
          <EmptyState
            description="Add a child below, or a year in the future for one you are planning for."
            icon={Baby}
            title="No kids in the plan"
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {kids.map((kid) => {
              const age = thisYear - kid.birthYear;
              const cost = kidCostAtAge(age);

              return (
                <li key={kid.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-medium text-ink">
                      {kid.name}
                    </div>
                    <div className="num mt-0.5 text-[12.5px] text-ink-3">
                      {age < 0
                        ? `Arriving ${kid.birthYear}`
                        : `Age ${age}, born ${kid.birthYear}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[14.5px] font-medium text-ink">
                      {cost > 0 ? formatMoney(toDisplay(cost), display) : "—"}
                    </div>
                    <div className="text-[12px] text-ink-3">
                      {cost > 0
                        ? "this year"
                        : age < 0
                          ? "not yet"
                          : "independent"}
                    </div>
                  </div>
                  <IconButton
                    icon={Trash2}
                    label={`Remove ${kid.name}`}
                    size="sm"
                    tone="danger"
                    onClick={() => removeKid(kid.id)}
                  />
                </li>
              );
            })}
            <li className="flex items-center justify-between py-3 text-[14px]">
              <span className="text-ink-2">Total this year</span>
              <span className="num font-medium text-ink">
                {formatMoney(toDisplay(totalThisYear), display)}
              </span>
            </li>
          </ul>
        )}

        <form
          className="rounded-xl border border-line-soft bg-wash p-4"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <FieldLabel htmlFor={nameId}>Add a child</FieldLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              className={clsx(
                INPUT_FRAME,
                "h-10 min-w-[140px] flex-1 px-3 text-[14px]",
              )}
              id={nameId}
              placeholder="Name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Stepper
              label="birth year"
              max={thisYear + 10}
              min={1990}
              value={birthYear}
              onChange={setBirthYear}
            />
            <Button
              disabled={!name.trim()}
              size="sm"
              type="submit"
              variant="primary"
            >
              Add
            </Button>
          </div>
          <p className="mt-2 text-[12.5px] text-ink-3">
            A future year models a child you&apos;re planning for.
          </p>
        </form>

        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">
            Cost by age
          </div>
          <ul className="divide-y divide-line-soft">
            {KID_COST_BANDS.map((band, index) => {
              const from = index === 0 ? 0 : KID_COST_BANDS[index - 1].untilAge;

              return (
                <li
                  key={band.label}
                  className="flex items-center justify-between py-2 text-[13px]"
                >
                  <span className="text-ink-2">
                    {band.label}
                    <span className="num ml-1.5 text-ink-4">
                      {from} to {band.untilAge - 1}
                    </span>
                  </span>
                  <span className="num text-ink-2">
                    {formatMoney(toDisplay(band.annualNzd), display)} a year
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Section>
  );
}
