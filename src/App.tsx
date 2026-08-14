import { Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { useAutoSnapshot } from "@/hooks/useAutoSnapshot";
import Dashboard from "@/pages/Dashboard";
import Export from "@/pages/Export";
import Settings from "@/pages/Settings";
import Simulate from "@/pages/Simulate";
import Spending from "@/pages/Spending";

export default function App() {
  useAutoSnapshot();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route element={<Spending />} path="/spending" />
        <Route element={<Simulate />} path="/simulate" />
        <Route element={<Export />} path="/export" />
        <Route element={<Settings />} path="/settings" />
      </Route>
    </Routes>
  );
}
