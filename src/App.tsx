import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Layout from "./components/layout/Layout";
import Dashboard from "./components/Dashboard";
import AssetManagement from "./components/AssetManagement";
import ChartsPage from "./components/ChartsPage";
import Milestones from "./components/Milestones";
import Settings from "./components/Settings";

function App() {
  const location = useLocation();

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    if (!path) return "dashboard";
    return path;
  };

  return (
    <Layout activeTab={getActiveTab()}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetManagement />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
