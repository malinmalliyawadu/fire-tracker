import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/** An empty section is an invitation: say what goes here and offer the way in. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line px-6 py-7 sm:flex-row sm:items-center sm:gap-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-wash text-ink-2">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-medium text-ink">{title}</h3>
        {description && (
          <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-snug text-ink-3">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
