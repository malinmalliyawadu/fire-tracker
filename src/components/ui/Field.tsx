import type { ReactNode } from "react";

import clsx from "clsx";

/**
 * The one micro-label style. Section headings inside dialogs, card eyebrows and
 * field labels all use it, so a dialog reads as a single column of fields
 * rather than a stack of differently-labelled widgets.
 */
export const FIELD_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400";

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
        <span aria-hidden className="ml-1 text-loss">
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
  /** Right-hand side of the label row — a running total, a unit, a toggle. */
  meta?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A labelled block of controls.
 *
 * The label sits in normal flow above its children, which is the whole point:
 * an absolutely-positioned label (what HeroUI's `labelPlacement="outside"`
 * gives you) overlaps whatever precedes it in a `space-y` stack.
 */
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
          <span className="shrink-0 text-[11px] text-ink-400">{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}
