import type { ReactNode } from "react";

import clsx from "clsx";

interface CardProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Card({
  title,
  eyebrow,
  action,
  className,
  bodyClassName,
  children,
}: CardProps) {
  const showHeader = Boolean(title || eyebrow || action);

  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900/50 shadow-card backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {showHeader && (
        <header className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div>
            {eyebrow && (
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={clsx(showHeader ? "px-6 pb-6 pt-1" : "p-6", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
