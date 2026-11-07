import type { ReactNode } from "react";

import clsx from "clsx";

/**
 * The one field-label style: sentence case, medium weight, the secondary ink.
 * Dialog section headings and field labels share it, so a form reads as one
 * column rather than a stack of differently-labelled widgets.
 */
export const FIELD_LABEL_CLASS = "text-[13px] font-medium text-ink-2";

interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function FieldLabel({
  children,
  htmlFor,
  required,
  className,
}: FieldLabelProps) {
  const content = (
    <>
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-flame-ink">
          *
        </span>
      )}
    </>
  );

  if (htmlFor) {
    return (
      <label className={clsx(FIELD_LABEL_CLASS, className)} htmlFor={htmlFor}>
        {content}
      </label>
    );
  }

  return <span className={clsx(FIELD_LABEL_CLASS, className)}>{content}</span>;
}

interface FieldProps {
  label: ReactNode;
  /** Right-hand side of the label row: a running total, a unit, a toggle. */
  meta?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** A labelled block of controls, label in normal flow above its children. */
export function Field({
  label,
  meta,
  htmlFor,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={htmlFor} required={required}>
          {label}
        </FieldLabel>
        {meta && (
          <span className="num shrink-0 text-[12.5px] text-ink-3">{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Shared frame for card fields: a label row over an oversized value. The
 * frame carries the focus affordance, so the input inside it suppresses the
 * global ring rather than drawing a second box.
 */
export const CARD_FRAME =
  "rounded-xl border border-line bg-surface px-4 py-3.5 transition-[border-color,box-shadow] duration-[var(--dur-hover)] hover:border-ink-3 focus-within:border-ink focus-within:shadow-[0_0_0_3px_var(--wash-strong)] focus-within:hover:border-ink";

/** Shared frame for text-like inputs. */
export const INPUT_FRAME =
  "w-full rounded-lg border border-line bg-surface text-ink outline-none transition-[border-color,box-shadow] duration-[var(--dur-hover)] placeholder:text-ink-4 hover:border-ink-3 focus:border-ink focus:shadow-[0_0_0_3px_var(--wash-strong)] focus-visible:outline-none";
