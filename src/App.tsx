import { Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { useAutoSnapshot } from "@/hooks/useAutoSnapshot";
import Dashboard from "@/pages/Dashboard";
import Export from "@/pages/Export";
import Settings from "@/pages/Settings";
import Simulate from "@/pages/Simulate";

export default function App() {
  useAutoSnapshot();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<Dashboard />} index />
        <Route element={<Simulate />} path="/simulate" />
        <Route element={<Export />} path="/export" />
        <Route element={<Settings />} path="/settings" />
      </Route>
    </Routes>
  );
}
