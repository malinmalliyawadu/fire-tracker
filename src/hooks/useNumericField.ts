import type { ChangeEvent } from "react";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  formatNumericDraft,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/domain/number";

interface NumericFieldOptions {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Allow a decimal point. Off for ages and other whole-number fields. */
  allowDecimal?: boolean;
  /** Show thousands separators while typing. */
  grouping?: boolean;
}

interface NumericFieldProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  inputMode: "decimal" | "numeric";
}

const toDraft = (value: number | null): string =>
  value === null ? "" : String(value);

/** Count the characters of `text` that survive sanitizing — i.e. caret anchors. */
const countAnchors = (text: string, allowDecimal: boolean): number => {
  let count = 0;
  let seenPoint = false;

  for (const char of text) {
    if (char >= "0" && char <= "9") {
      count++;
    } else if (allowDecimal && char === "." && !seenPoint) {
      seenPoint = true;
      count++;
    }
  }

  return count;
};

/** Position in the displayed text that sits just after `anchors` anchor chars. */
const caretAfterAnchors = (display: string, anchors: number): number => {
  if (anchors <= 0) return 0;

  let count = 0;

  for (let i = 0; i < display.length; i++) {
    if (display[i] !== ",") count++;
    if (count === anchors) return i + 1;
  }

  return display.length;
};

/**
 * Props for a text input that accepts numbers the way people type them.
 *
 * Commas and other separators are stripped on the way in, thousands separators
 * are re-applied for display, and the caret stays where the user put it.
 */
export function useNumericField({
  value,
  onChange,
  allowDecimal = true,
  grouping = true,
}: NumericFieldOptions): NumericFieldProps {
  const [draft, setDraft] = useState(() => toDraft(value));
  const elementRef = useRef<HTMLInputElement | null>(null);
  const anchorsRef = useRef<number | null>(null);

  // Adopt external changes (dialog reopened, store reset) unless the user is
  // mid-edit, in which case their partial text wins.
  useEffect(() => {
    if (elementRef.current && document.activeElement === elementRef.current) {
      return;
    }
    setDraft((prev) =>
      parseNumericInput(prev) === value ? prev : toDraft(value),
    );
  }, [value]);

  useLayoutEffect(() => {
    const element = elementRef.current;
    const anchors = anchorsRef.current;

    if (!element || anchors === null) return;

    anchorsRef.current = null;
    const caret = caretAfterAnchors(element.value, anchors);

    element.setSelectionRange(caret, caret);
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.target;
    const typed = element.value;
    const caret = element.selectionStart ?? typed.length;

    elementRef.current = element;
    anchorsRef.current = countAnchors(typed.slice(0, caret), allowDecimal);

    const next = sanitizeNumericInput(typed, { allowDecimal });

    setDraft(next);
    onChange(parseNumericInput(next));
  };

  const handleBlur = () => {
    // Normalise what the user left behind: "1." -> "1", "007" -> "7".
    setDraft(toDraft(value));
  };

  return {
    value: grouping ? formatNumericDraft(draft) : draft,
    onChange: handleChange,
    onBlur: handleBlur,
    inputMode: allowDecimal ? "decimal" : "numeric",
  };
}
