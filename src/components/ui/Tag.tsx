import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import clsx from "clsx";

interface TagProps {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "flame" | "gain" | "loss" | "note";
  title?: string;
  className?: string;
}

const TONE: Record<NonNullable<TagProps["tone"]>, string> = {
  default: "bg-wash text-ink-2",
  flame: "bg-flame-wash text-flame-ink",
  gain: "bg-gain-wash text-gain",
  loss: "bg-loss-wash text-loss",
  note: "bg-note-wash text-note",
};

/** A small inline qualifier: a currency, a lock, an exclusion. */
export function Tag({
  children,
  icon: Icon,
  tone = "default",
  title,
  className,
}: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 py-0.5 text-[11.5px] font-medium leading-none",
        TONE[tone],
        className,
      )}
      title={title}
    >
      {Icon && <Icon aria-hidden className="h-3 w-3" strokeWidth={2.25} />}
      {children}
    </span>
  );
}
