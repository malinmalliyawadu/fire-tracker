import { useState } from "react";

import Layout from "./components/layout/Layout";
import Dashboard from "./components/Dashboard";
import AssetManagement from "./components/AssetManagement";
import ChartsPage from "./components/ChartsPage";
import Milestones from "./components/Milestones";
import Settings from "./components/Settings";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "assets":
        return <AssetManagement />;
      case "charts":
        return <ChartsPage />;
      case "milestones":
        return <Milestones />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
