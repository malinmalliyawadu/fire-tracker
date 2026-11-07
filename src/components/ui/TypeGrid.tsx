import type { LucideIcon } from "lucide-react";

import clsx from "clsx";

interface TypeGridOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface TypeGridProps<T extends string> {
  options: TypeGridOption<T>[];
  value: T;
  onChange: (value: T) => void;
  cols?: 2 | 3 | 4 | 6;
}

const COL_CLASS: Record<2 | 3 | 4 | 6, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
};

export function TypeGrid<T extends string>({
  options,
  value,
  onChange,
  cols = 3,
}: TypeGridProps<T>) {
  return (
    <div className={clsx("grid gap-2", COL_CLASS[cols])}>
      {options.map((opt) => {
        const isActive = value === opt.value;

        return (
          <button
            key={opt.value}
            aria-pressed={isActive}
            className={clsx(
              "press group flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[12.5px] font-medium transition-colors duration-[var(--dur-hover)]",
              isActive
                ? "border-ink bg-ink text-on-ink"
                : "border-line text-ink-2 hover:border-ink-3 hover:text-ink",
            )}
            type="button"
            onClick={() => onChange(opt.value)}
          >
            <opt.icon
              className={clsx(
                "h-4 w-4",
                isActive ? "text-on-ink" : "text-ink-3 group-hover:text-ink",
              )}
              strokeWidth={2}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
