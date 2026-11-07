import { Outlet, useLocation } from "react-router-dom";

import { MobileTabs } from "./MobileTabs";
import { TopBar } from "./TopBar";

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto w-full max-w-[1280px] px-5 pb-28 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-20 lg:pt-12">
        {/* Keyed on the path so each page settles in once. */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <MobileTabs />
    </div>
  );
}
