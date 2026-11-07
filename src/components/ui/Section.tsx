import type { ReactNode } from "react";

import clsx from "clsx";

interface SectionProps {
  title?: ReactNode;
  /** One line under the title saying what the section is for. */
  lede?: ReactNode;
  /** Right-hand slot in the heading row: an action, a count, a status. */
  aside?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A page section: a heading row above a hairline, content beneath.
 *
 * Sections replace cards for anything that reads rather than frames an
 * interaction. The rule is the structure; the whitespace is the hierarchy.
 */
export function Section({
  title,
  lede,
  aside,
  id,
  className,
  children,
}: SectionProps) {
  return (
    <section className={clsx("scroll-mt-24", className)} id={id}>
      {(title || aside) && (
        <header className="mb-5 flex items-end justify-between gap-6 border-b border-line pb-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                {title}
              </h2>
            )}
            {lede && (
              <p className="mt-0.5 max-w-xl text-[13.5px] leading-snug text-ink-3">
                {lede}
              </p>
            )}
          </div>
          {aside && (
            <div className="flex shrink-0 items-center gap-2 pb-0.5">
              {aside}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

interface PanelProps {
  className?: string;
  /** Flush content, for ledgers and charts that bring their own padding. */
  flush?: boolean;
  tone?: "surface" | "wash";
  children: ReactNode;
}

/**
 * A framed surface, used only where a boundary carries meaning: a control
 * panel, a dialog body, a highlighted figure. Not a default container.
 */
export function Panel({
  className,
  flush = false,
  tone = "surface",
  children,
}: PanelProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line-soft",
        tone === "surface" ? "bg-surface" : "bg-wash",
        !flush && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageIntroProps {
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
}

/** The page's opening line. One sentence of purpose, no label above it. */
export function PageIntro({ title, lede, actions }: PageIntroProps) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h1 className="display-wide text-[32px] text-ink sm:text-[36px]">
          {title}
        </h1>
        {lede && (
          <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-ink-2">
            {lede}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
