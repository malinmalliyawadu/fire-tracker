import type { ReactNode } from "react";

import clsx from "clsx";
import { useId, useState } from "react";

import { isIsoDate } from "@/domain/age";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { CARD_FRAME, FieldLabel } from "@/components/ui/Field";

type CardSize = "sm" | "md";

interface DateCardProps {
  label: string;
  /** YYYY-MM-DD. */
  value: string;
  /** Called with a whole date only; a half-typed one never leaves the card. */
  onChange: (value: string) => void;
  /** Read-only figure pinned to the right of the label row. */
  meta?: ReactNode;
  hint?: ReactNode;
  size?: CardSize;
  /** YYYY-MM-DD bounds handed to the native picker. */
  min?: string;
  max?: string;
  focusOnMount?: boolean;
}

const VALUE_SIZE: Record<CardSize, string> = {
  sm: "text-[20px]",
  md: "text-[26px]",
};

/**
 * A framed date field, the {@link NumericCard} of dates: a label, the date
 * in the display face, the native picker behind it. Dates of birth go
 * through this so they sit beside the numeric cards as equals.
 */
export function DateCard({
  label,
  value,
  onChange,
  meta,
  hint,
  size = "md",
  min = "1900-01-01",
  max,
  focusOnMount = false,
}: DateCardProps) {
  const id = useId();
  const focusRef = useAutoFocus<HTMLInputElement>(focusOnMount);

  // The native field reports an empty value while a date is being typed, so
  // the draft lives here and the caller only hears about whole dates. A new
  // value from outside replaces whatever was in progress.
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);

  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  return (
    <div className={CARD_FRAME}>
      <div className="mb-1.5 flex min-h-[22px] items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {meta && (
          <span className="num shrink-0 text-[12.5px] text-ink-3">{meta}</span>
        )}
      </div>
      <input
        ref={focusRef}
        className={clsx(
          "display block w-full min-w-0 bg-transparent font-medium text-ink",
          "outline-none focus-visible:outline-none",
          VALUE_SIZE[size],
        )}
        id={id}
        max={max}
        min={min}
        type="date"
        value={draft}
        onBlur={() => {
          if (!isIsoDate(draft)) setDraft(value);
        }}
        onChange={(event) => {
          const next = event.target.value;

          setDraft(next);
          if (isIsoDate(next)) onChange(next);
        }}
      />
      {hint && <div className="mt-1.5 text-[12.5px] text-ink-3">{hint}</div>}
    </div>
  );
}
