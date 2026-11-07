import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { useAutoSnapshot } from "@/hooks/useAutoSnapshot";
import CashFlow from "@/pages/CashFlow";
import Overview from "@/pages/Overview";
import Portfolio from "@/pages/Portfolio";
import Settings from "@/pages/Settings";
import Simulate from "@/pages/Simulate";

export default function App() {
  useAutoSnapshot();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Overview />} />
        <Route element={<Portfolio />} path="/portfolio" />
        <Route element={<CashFlow />} path="/cashflow" />
        <Route element={<Simulate />} path="/simulate" />
        <Route element={<Settings />} path="/settings" />
        {/* Old addresses keep working. */}
        <Route element={<Navigate replace to="/cashflow" />} path="/spending" />
        <Route
          element={<Navigate replace to="/settings#data" />}
          path="/export"
        />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  );
}
