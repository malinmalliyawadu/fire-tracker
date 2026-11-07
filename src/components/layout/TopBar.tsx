import clsx from "clsx";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { NavLink, Link } from "react-router-dom";

import { NAV_ITEMS } from "./nav";
import { FlameMark } from "./FlameMark";

import { describeYears, useFireSummary } from "@/hooks/useFireSummary";
import { useUi } from "@/store/ui";
import { Segmented } from "@/components/ui/Segmented";

const THEME_OPTIONS = [
  { value: "light" as const, label: "", icon: Sun, ariaLabel: "Light" },
  {
    value: "system" as const,
    label: "",
    icon: Monitor,
    ariaLabel: "Match system",
  },
  { value: "dark" as const, label: "", icon: Moon, ariaLabel: "Dark" },
];

export function TopBar() {
  const reduce = useReducedMotion();
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-[color:var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-6 px-5 sm:px-8 lg:px-10">
        <Link
          aria-label="FIRE Tracker, overview"
          className="flex items-center gap-2 rounded-md"
          to="/"
        >
          <FlameMark className="h-5 w-5" />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">
            FIRE
          </span>
        </Link>

        <LayoutGroup id="topnav">
          <nav aria-label="Primary" className="hidden h-full md:flex">
            <ul className="flex h-full items-stretch gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to} className="flex">
                  <NavLink
                    className={({ isActive }) =>
                      clsx(
                        "relative flex items-center px-2.5 text-[14px] font-medium transition-colors duration-[var(--dur-hover)]",
                        isActive ? "text-ink" : "text-ink-3 hover:text-ink",
                      )
                    }
                    end={item.to === "/"}
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <>
                        {item.label}
                        {isActive && (
                          <motion.span
                            aria-hidden
                            className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-ink"
                            layoutId="nav-underline"
                            transition={
                              reduce
                                ? { duration: 0 }
                                : { type: "spring", duration: 0.4, bounce: 0.1 }
                            }
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </LayoutGroup>

        <div className="ml-auto flex items-center gap-3">
          <StatusMark />
          <Segmented
            ariaLabel="Colour scheme"
            options={THEME_OPTIONS}
            size="sm"
            value={theme}
            onChange={setTheme}
          />
        </div>
      </div>
    </header>
  );
}

/** The plan's one-line status, always in view. */
function StatusMark() {
  const summary = useFireSummary();

  let text: string;

  if (summary.reached) text = "Financially independent";
  else if (summary.never) text = "No FIRE date yet";
  else
    text = `Independent at ${summary.age}, in ${describeYears(summary.years)}`;

  return (
    <Link
      className="hidden items-center gap-2 rounded-full border border-line-soft py-1 pl-1.5 pr-3 text-[12.5px] text-ink-2 transition-colors duration-[var(--dur-hover)] hover:border-line hover:text-ink lg:inline-flex"
      to="/"
    >
      <span
        aria-hidden
        className={clsx(
          "h-2 w-2 rounded-full",
          summary.never ? "bg-ink-4" : "bg-flame",
        )}
      />
      {text}
    </Link>
  );
}
