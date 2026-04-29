import type { LucideIcon } from "lucide-react";

import {
  FileText,
  Flame,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/simulate", label: "Simulate", icon: Sparkles },
  { to: "/export", label: "Export", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-20 flex w-60 flex-col border-r border-white/[0.06] bg-ink-900/40 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-6 pb-8 pt-7">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-deep shadow-glow">
          <Flame className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight">FIRE</div>
          <div className="-mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-400">
            Tracker
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            end={item.to === "/"}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-ink-300 hover:bg-white/[0.03] hover:text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-glow" />
                )}
                <item.icon
                  className={clsx(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-accent" : "text-ink-400",
                  )}
                  strokeWidth={2}
                />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 pb-6 pt-2 text-[10px] uppercase tracking-[0.18em] text-ink-500">
        v2 · expressive
      </div>
    </aside>
  );
}
