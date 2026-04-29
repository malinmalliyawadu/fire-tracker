import { Outlet } from "react-router-dom";

import { AmbientBlobs } from "./AmbientBlobs";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="relative min-h-screen">
      <AmbientBlobs />
      <Sidebar />
      <main className="relative z-10 ml-60 min-h-screen">
        <div className="mx-auto max-w-7xl px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
