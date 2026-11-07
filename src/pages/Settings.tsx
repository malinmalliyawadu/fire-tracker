import clsx from "clsx";
import { useEffect, useState } from "react";

import { Currency } from "@/components/settings/Currency";
import { ExportData } from "@/components/settings/ExportData";
import { Goals } from "@/components/settings/Goals";
import { Household } from "@/components/settings/Household";
import { ImportData } from "@/components/settings/ImportData";
import { Profile } from "@/components/settings/Profile";
import { Super } from "@/components/settings/Super";
import { Tax } from "@/components/settings/Tax";
import { WipeData } from "@/components/settings/WipeData";
import { PageIntro, Section } from "@/components/ui/Section";

const INDEX = [
  { id: "you", label: "You" },
  { id: "goals", label: "Goals" },
  { id: "household", label: "Household" },
  { id: "tax", label: "Tax" },
  { id: "super", label: "Super and KiwiSaver" },
  { id: "currency", label: "Currency" },
  { id: "data", label: "Your data" },
];

/** The id of the section whose top is nearest the top of the viewport. */
function useNearestSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }

        if (visible.size === 0) return;

        const nearest = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];

        setActive(nearest[0]);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );

    for (const id of ids) {
      const element = document.getElementById(id);

      if (element) observer.observe(element);
    }

    // At the foot of the page the last section can never reach the top, so
    // it takes over once there is nothing left to scroll.
    const onScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      if (bottom) setActive(ids[ids.length - 1]);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids]);

  return active;
}

const INDEX_IDS = INDEX.map((item) => item.id);

export default function Settings() {
  const active = useNearestSection(INDEX_IDS);

  // The route can arrive with a hash before the sections have mounted.
  useEffect(() => {
    const id = window.location.hash.slice(1);

    if (!id) return;

    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div>
      <PageIntro
        lede="The assumptions every projection is built on. Change one and every page updates."
        title="Settings"
      />

      <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Settings sections"
          className="hidden self-start lg:sticky lg:top-20 lg:block"
        >
          <ul className="space-y-1.5">
            {INDEX.map((item) => (
              <li key={item.id}>
                <a
                  className={clsx(
                    "block rounded-md py-0.5 text-[13.5px] transition-colors duration-[var(--dur-hover)]",
                    active === item.id
                      ? "font-medium text-ink"
                      : "text-ink-3 hover:text-ink",
                  )}
                  href={`#${item.id}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          <Profile />
          <Goals />
          <Household />
          <Tax />
          <Super />
          <Currency />
          <Section
            id="data"
            lede="Everything lives in this browser. Take it with you, bring it back, or clear it."
            title="Your data"
          >
            <div className="space-y-6">
              <ExportData />
              <div className="border-t border-line-soft pt-6">
                <ImportData />
              </div>
              <div className="border-t border-line-soft pt-6">
                <WipeData />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
