import type { ReactNode } from "react";

import clsx from "clsx";
import { AlertTriangle, Check, Info } from "lucide-react";

interface CalloutProps {
  tone: "warning" | "note" | "success";
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const STYLE = {
  warning: { icon: AlertTriangle, text: "text-loss", bar: "bg-loss" },
  note: { icon: Info, text: "text-note", bar: "bg-note" },
  success: { icon: Check, text: "text-gain", bar: "bg-gain" },
} as const;

/**
 * A message that needs a reader's attention. A coloured hairline at the left
 * carries the tone; the text stays in ink so it reads like the page.
 */
export function Callout({
  tone,
  title,
  children,
  action,
  className,
}: CalloutProps) {
  const { icon: Icon, text, bar } = STYLE[tone];

  return (
    <div className={clsx("relative py-1 pl-5", className)}>
      <span
        aria-hidden
        className={clsx("absolute inset-y-0 left-0 w-[3px] rounded-full", bar)}
      />
      <div className="flex items-start gap-2.5">
        <Icon
          className={clsx("mt-[3px] h-4 w-4 shrink-0", text)}
          strokeWidth={2}
        />
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium text-ink">{title}</div>
          {children && (
            <div className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
              {children}
            </div>
          )}
          {action && <div className="mt-2.5">{action}</div>}
        </div>
      </div>
    </div>
  );
}
