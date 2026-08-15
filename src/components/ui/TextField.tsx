import type { ReactNode, Ref } from "react";

import clsx from "clsx";
import { useId } from "react";

import { Field } from "@/components/ui/Field";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  required?: boolean;
  tone?: "accent" | "loss";
  inputRef?: Ref<HTMLInputElement>;
}

const TONE_FOCUS: Record<NonNullable<TextFieldProps["tone"]>, string> = {
  accent: "focus:border-accent/40 focus:bg-accent/[0.04]",
  loss: "focus:border-loss/40 focus:bg-loss/[0.04]",
};

/**
 * A plain text field in the dialog's own visual language.
 *
 * Deliberately not HeroUI's `Input`: its outside label is absolutely
 * positioned, so in a vertical stack it lands on top of the control above it,
 * and its own label typography fights the uppercase micro-labels used
 * everywhere else in these dialogs.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  tone = "accent",
  inputRef,
}: TextFieldProps) {
  const id = useId();

  return (
    <Field htmlFor={id} label={label} meta={hint} required={required}>
      <input
        ref={inputRef}
        className={clsx(
          "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5",
          "text-sm text-white outline-none transition-colors",
          "placeholder:text-ink-500 hover:border-white/15 focus-visible:outline-none",
          TONE_FOCUS[tone],
        )}
        id={id}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
