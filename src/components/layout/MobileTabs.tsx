import clsx from "clsx";
import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "./nav";

/** Bottom tabs on narrow screens, where a top nav is out of thumb's reach. */
export function MobileTabs() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-[color:var(--bg)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              className={({ isActive }) =>
                clsx(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-[var(--dur-hover)]",
                  isActive ? "text-ink" : "text-ink-3",
                )
              }
              end={item.to === "/"}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
