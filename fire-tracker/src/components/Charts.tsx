import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useMemo } from "react";

import { useFireStore } from "../store/fireStore";
import {
  generateProjection,
  formatCurrency,
  convertToMonthlyContribution,
} from "../utils/fireCalculations";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  "individual-stock": COLORS.primary,
  "kiwisaver": COLORS.success,
  "savings-account": COLORS.warning,
  "term-deposit": COLORS.purple,
  "bitcoin": COLORS.danger,
  "ethereum": COLORS.cyan,
  "other": COLORS.indigo,
};

export function FIREProjectionChart() {
  const { assets, liabilities, settings, getNetWorth } = useFireStore();

  const projectionData = useMemo(() => {
    const currentNetWorth = getNetWorth();

    const totalAssetContributions = assets.reduce((sum, asset) => {
      // Handle missing contributionFrequency field for backward compatibility
      const frequency = asset.contributionFrequency || "monthly";
      const contribution = convertToMonthlyContribution(asset.contributions || 0, frequency);
      return sum + contribution;
    }, 0);

    const totalLiabilityPayments = liabilities.reduce((sum, liability) => {
      const frequency = liability.paymentFrequency || "monthly";
      const monthlyPayment = convertToMonthlyContribution(liability.minimumPayment, frequency);
      return sum + monthlyPayment;
    }, 0);

    // Net available for investing after liability payments
    const monthlyContribution = Math.max(0, totalAssetContributions - totalLiabilityPayments);

    // Debug logging
    console.log('Chart Debug:', {
      currentNetWorth,
      totalAssetContributions,
      totalLiabilityPayments,
      netMonthlyContribution: monthlyContribution,
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length,
      totalAssetValue: assets.reduce((sum, asset) => sum + (asset.value || 0), 0),
      assets: assets.map(asset => ({
        name: asset.name,
        value: asset.value,
        contributions: asset.contributions,
        frequency: asset.contributionFrequency,
      })),
      liabilities: liabilities.map(liability => ({
        name: liability.name,
        balance: liability.balance,
        minimumPayment: liability.minimumPayment,
      })),
    });

    const projection = generateProjection(
      currentNetWorth,
      monthlyContribution,
      settings.expectedReturn,
      settings.currentAge,
      40,
      settings.retirementAge,
      settings.withdrawalRate
    );

    // Debug first few projection points
    console.log('First 3 projection points:', projection.slice(0, 3));

    return projection.map((point) => ({
      age: point.age,
      value: point.value,
      initialNetWorth: currentNetWorth, // Your starting amount
      newContributions: point.contributions, // New contributions over time
      investmentGrowth: point.growth, // Growth on all money
      fireTarget: settings.fireTarget,
      leanFire: settings.fireTarget * 0.6,
      fatFire: settings.fireTarget * 1.5,
      isRetirementAge: point.age === settings.retirementAge ? point.value : null,
    }));
  }, [assets, liabilities, settings, getNetWorth]);

  // Show helpful message if no assets
  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            FIRE Progress Projection
          </h3>
        </CardHeader>
        <CardBody>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No assets found. Add some assets to see your FIRE projection.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Go to the Assets page to add your investments, savings, and other assets.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          FIRE Progress Projection
        </h3>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, settings.currency),
                  name === 'value' ? 'Total Net Worth' :
                  name === 'initialNetWorth' ? 'Current Net Worth' :
                  name === 'newContributions' ? 'New Contributions' :
                  name === 'investmentGrowth' ? 'Investment Growth' :
                  name === 'fireTarget' ? 'FIRE Target' :
                  name === 'leanFire' ? 'Lean FIRE' :
                  name === 'fatFire' ? 'Fat FIRE' : name
                ]}
                labelFormatter={(age) => `Age: ${age}`}
              />
              <Area
                type="monotone"
                dataKey="initialNetWorth"
                stackId="1"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="newContributions"
                stackId="1"
                stroke={COLORS.warning}
                fill={COLORS.warning}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="investmentGrowth"
                stackId="1"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="fireTarget"
                stroke={COLORS.primary}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="leanFire"
                stroke={COLORS.success}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fatFire"
                stroke={COLORS.purple}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="isRetirementAge"
                stroke={COLORS.danger}
                strokeWidth={3}
                dot={{ fill: COLORS.danger, strokeWidth: 3, r: 8 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Current Net Worth</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>New Contributions</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Investment Growth</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-blue-500"></div>
            <span>FIRE Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-green-500"></div>
            <span>Lean FIRE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-purple-500"></div>
            <span>Fat FIRE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Retirement Age ({settings.retirementAge})</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function AssetAllocationChart() {
  const { assets, settings } = useFireStore();

  const allocationData = useMemo(() => {
    const typeMap = new Map<string, number>();

    assets.forEach((asset) => {
      const current = typeMap.get(asset.type) || 0;
      typeMap.set(asset.type, current + asset.value);
    });

    return Array.from(typeMap.entries()).map(([type, value]) => ({
      name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      percentage: ((value / assets.reduce((sum, a) => sum + a.value, 0)) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);
  }, [assets]);

  if (allocationData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Asset Allocation
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No assets to display. Add some assets to see your allocation.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Asset Allocation
        </h3>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => {
                  const assetType = entry.name.toLowerCase().replace(' ', '-');
                  const color = ASSET_TYPE_COLORS[assetType] || COLORS.indigo;
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, settings.currency),
                  'Value'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {allocationData.map((item, index) => {
            const assetType = item.name.toLowerCase().replace(' ', '-');
            const color = ASSET_TYPE_COLORS[assetType] || COLORS.indigo;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.value, settings.currency)} ({item.percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function NetWorthHistoryChart() {
  const { history, settings } = useFireStore();

  const chartData = useMemo(() => {
    return history
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((snapshot) => ({
        date: new Date(snapshot.date).toLocaleDateString(),
        assets: snapshot.assets,
        liabilities: snapshot.liabilities,
        netWorth: snapshot.netWorth,
      }));
  }, [history]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Net Worth History
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No history data. Save some snapshots to see your progress over time.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Net Worth History
        </h3>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, settings.currency),
                  name === 'assets' ? 'Assets' :
                  name === 'liabilities' ? 'Liabilities' :
                  'Net Worth'
                ]}
              />
              <Line
                type="monotone"
                dataKey="assets"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="liabilities"
                stroke={COLORS.danger}
                strokeWidth={2}
                dot={{ fill: COLORS.danger, strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Assets</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Liabilities</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Net Worth</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}