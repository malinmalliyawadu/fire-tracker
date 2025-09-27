import { BarChart3 } from "lucide-react";

import {
  FIREProjectionChart,
  AssetAllocationChart,
  NetWorthHistoryChart,
} from "./Charts";

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Charts & Analytics
        </h1>
      </div>

      <div className="space-y-6">
        <FIREProjectionChart />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocationChart />
          <NetWorthHistoryChart />
        </div>
      </div>
    </div>
  );
}