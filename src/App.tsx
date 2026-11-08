import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { useAutoSnapshot } from "@/hooks/useAutoSnapshot";
import { useKeepAgesCurrent } from "@/hooks/useKeepAgesCurrent";
import CashFlow from "@/pages/CashFlow";
import Overview from "@/pages/Overview";
import Portfolio from "@/pages/Portfolio";
import Settings from "@/pages/Settings";
import Simulate from "@/pages/Simulate";

// Carries years of daily index closes, so it loads only when opened.
const Performance = lazy(() => import("@/pages/Performance"));

export default function App() {
  useKeepAgesCurrent();
  useAutoSnapshot();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Overview />} />
        <Route element={<Portfolio />} path="/portfolio" />
        <Route
          element={
            <Suspense fallback={null}>
              <Performance />
            </Suspense>
          }
          path="/performance"
        />
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
