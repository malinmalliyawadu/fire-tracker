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
} from "recharts";
import { useMemo } from "react";
import { TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react";

import { useFireStore } from "../store/fireStore";
import {
  generateProjection,
  formatCurrency,
  convertToMonthlyContribution,
} from "../utils/fireCalculations";
import type { ChartFilters } from "../utils/chartFilters";
import { filterAssets, filterLiabilities } from "../utils/chartFilters";
import { convertAssetValue } from "../utils/currencyUtils";

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

interface FIREProjectionChartProps {
  filters?: ChartFilters;
}

export function FIREProjectionChart({ filters }: FIREProjectionChartProps) {
  const { assets, liabilities, settings, getNetWorth } = useFireStore();

  const projectionData = useMemo(() => {
    // Apply filters if provided
    const filteredAssets = filters ? filterAssets(assets, filters) : assets;
    const filteredLiabilities = filters ? filterLiabilities(liabilities, filters) : liabilities;

    // Calculate net worth based on filtered data
    // Convert all assets to the settings currency (NZD) for proper calculation
    const filteredTotalAssets = filteredAssets.reduce((sum, asset) => {
      const convertedValue = convertAssetValue(asset, settings.currency);
      return sum + convertedValue;
    }, 0);
    const filteredTotalLiabilities = filteredLiabilities.reduce((sum, liability) => sum + liability.balance, 0);
    const currentNetWorth = filteredTotalAssets - filteredTotalLiabilities;

    const totalAssetContributions = filteredAssets.reduce((sum, asset) => {
      // Handle missing contributionFrequency field for backward compatibility
      const frequency = asset.contributionFrequency || "monthly";
      const contribution = convertToMonthlyContribution(asset.contributions || 0, frequency);
      return sum + contribution;
    }, 0);

    const totalLiabilityPayments = filteredLiabilities.reduce((sum, liability) => {
      const frequency = liability.paymentFrequency || "monthly";
      const monthlyPayment = convertToMonthlyContribution(liability.minimumPayment, frequency);
      console.log(`Liability: ${liability.name}, Payment: ${liability.minimumPayment}, Frequency: ${frequency}, Monthly: ${monthlyPayment}`);
      return sum + monthlyPayment;
    }, 0);

    // Check if we're dealing with debt-only scenario (liabilities but no assets)
    const isDebtOnly = filteredAssets.length === 0 && filteredLiabilities.length > 0;

    // Calculate monthly contribution based on whether we have negative net worth
    let monthlyContribution;
    if (currentNetWorth < 0) {
      // If net worth is negative (more liabilities than assets),
      // use liability payments as positive contributions that reduce debt
      monthlyContribution = totalLiabilityPayments;
    } else if (currentNetWorth === 0 && filteredAssets.length === 0 && filteredLiabilities.length > 0) {
      // Debt is paid off and no assets selected - no more contributions
      monthlyContribution = 0;
    } else {
      // Normal case: net contribution is assets minus liability payments
      monthlyContribution = Math.max(0, totalAssetContributions - totalLiabilityPayments);
    }

    // Debug logging
    console.log('Chart Debug:', {
      currentNetWorth,
      filteredTotalAssets,
      filteredTotalLiabilities,
      totalAssetContributions,
      totalLiabilityPayments,
      netMonthlyContribution: monthlyContribution,
      filteredAssetsCount: filteredAssets.length,
      filteredLiabilitiesCount: filteredLiabilities.length,
      hasFilters: !!filters,
      isDebtOnly,
      filterDetails: filters ? {
        assetTypes: filters.assetTypes,
        liabilityTypes: filters.liabilityTypes,
        selectedAssets: filters.selectedAssets,
        selectedLiabilities: filters.selectedLiabilities,
      } : null,
      assets: filteredAssets.map(asset => ({
        name: asset.name,
        value: asset.value,
        contributions: asset.contributions,
        frequency: asset.contributionFrequency,
      })),
      liabilities: filteredLiabilities.map(liability => ({
        name: liability.name,
        type: liability.type,
        balance: liability.balance,
        minimumPayment: liability.minimumPayment,
        paymentFrequency: liability.paymentFrequency,
      })),
      allLiabilities: liabilities.map(liability => ({
        name: liability.name,
        type: liability.type,
        balance: liability.balance,
      })),
    });

    // For debt-only scenarios, start at negative liability balance
    const startingValue = isDebtOnly ? -filteredTotalLiabilities : currentNetWorth;

    // For debt-only scenarios, use the average interest rate of the liabilities
    let interestRate = settings.expectedReturn;
    if (isDebtOnly && filteredLiabilities.length > 0) {
      const totalBalance = filteredLiabilities.reduce((sum, l) => sum + l.balance, 0);
      const weightedRate = filteredLiabilities.reduce((sum, l) =>
        sum + (l.interestRate / 100) * (l.balance / totalBalance), 0
      );
      interestRate = weightedRate;
      console.log('Using liability interest rate:', interestRate * 100 + '%', 'instead of expected return:', settings.expectedReturn * 100 + '%');
    }

    const projection = generateProjection(
      startingValue,
      monthlyContribution,
      interestRate,
      settings.currentAge,
      40,
      settings.retirementAge,
      settings.withdrawalRate,
      isDebtOnly,
      settings.expectedReturn // Investment return for after debt is paid
    );

    // Debug first few projection points
    console.log('First 3 projection points:', projection.slice(0, 3));

    return projection.map((point) => ({
      age: point.age,
      value: point.value,
      initialNetWorth: startingValue, // Your starting amount (stays constant)
      newContributions: point.contributions, // New contributions over time
      investmentGrowth: point.growth, // Growth on all money
      fireTarget: settings.fireTarget,
      leanFire: settings.fireTarget * 0.6,
      fatFire: settings.fireTarget * 1.5,
      isRetirementAge: point.age === settings.retirementAge ? point.value : null,
    }));
  }, [assets, liabilities, settings, getNetWorth, filters]);

  // Show helpful message if no assets after filtering AND no liabilities
  const filteredAssets = filters ? filterAssets(assets, filters) : assets;
  const filteredLiabilities = filters ? filterLiabilities(liabilities, filters) : liabilities;

  if (filteredAssets.length === 0 && filteredLiabilities.length === 0) {
    return (
      <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              FIRE Progress Projection
            </h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                {assets.length === 0 && liabilities.length === 0 ? 'No financial data yet' : 'No data matches current filters'}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {assets.length === 0 && liabilities.length === 0 ? 'Add assets or liabilities to see your FIRE projection' : 'Try adjusting your filters to include more data'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            FIRE Progress Projection
          </h3>
        </div>
      </CardHeader>
      <CardBody className="px-6 pb-6">
        <div className="h-96">
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
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                name="Net Worth"
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Net Worth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">FIRE Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Lean FIRE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Fat FIRE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Retirement ({settings.retirementAge})</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

interface AssetAllocationChartProps {
  filters?: ChartFilters;
}

export function AssetAllocationChart({ filters }: AssetAllocationChartProps) {
  const { assets, settings } = useFireStore();

  const allocationData = useMemo(() => {
    // Apply filters if provided
    const filteredAssets = filters ? filterAssets(assets, filters) : assets;
    const typeMap = new Map<string, number>();

    filteredAssets.forEach((asset) => {
      const current = typeMap.get(asset.type) || 0;
      const convertedValue = convertAssetValue(asset, settings.currency);
      typeMap.set(asset.type, current + convertedValue);
    });

    const totalValue = filteredAssets.reduce((sum, a) => {
      return sum + convertAssetValue(a, settings.currency);
    }, 0);

    return Array.from(typeMap.entries()).map(([type, value]) => ({
      name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      percentage: ((value / totalValue) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);
  }, [assets, filters, settings.currency]);

  if (allocationData.length === 0) {
    return (
      <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <PieChartIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Asset Allocation
            </h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                {assets.length === 0 ? 'No assets yet' : 'No assets match filters'}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {assets.length === 0 ? 'Add assets to see your allocation breakdown' : 'Try adjusting your filters to include assets'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Asset Allocation
          </h3>
        </div>
      </CardHeader>
      <CardBody className="px-6 pb-6">
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
        <div className="mt-6 space-y-3">
          {allocationData.map((item, index) => {
            const assetType = item.name.toLowerCase().replace(' ', '-');
            const color = ASSET_TYPE_COLORS[assetType] || COLORS.indigo;
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.value, settings.currency)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.percentage}%
                  </div>
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
      <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Net Worth History
            </h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                No history yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Save snapshots to track your net worth over time
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Net Worth History
          </h3>
        </div>
      </CardHeader>
      <CardBody className="px-6 pb-6">
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
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Assets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Liabilities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Net Worth</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}