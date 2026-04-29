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
  tone?: "accent" | "loss";
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
  tone = "accent",
}: TypeGridProps<T>) {
  const activeBorder =
    tone === "accent"
      ? "border-accent/40 bg-accent/[0.12] text-white"
      : "border-loss/40 bg-loss/[0.10] text-white";
  const activeIcon = tone === "accent" ? "text-accent" : "text-loss";
  const activeGlow =
    tone === "accent" ? "shadow-[0_0_24px_-8px_rgba(124,131,231,0.6)]" : "";

  return (
    <div className={clsx("grid gap-2", COL_CLASS[cols])}>
      {options.map((opt) => {
        const isActive = value === opt.value;

        return (
          <button
            key={opt.value}
            aria-pressed={isActive}
            className={clsx(
              "group flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-medium transition-all",
              isActive
                ? clsx(activeBorder, activeGlow)
                : "border-white/[0.06] bg-white/[0.02] text-ink-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
            )}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            <opt.icon
              className={clsx(
                "h-4 w-4 transition-colors",
                isActive ? activeIcon : "text-ink-400 group-hover:text-white",
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
