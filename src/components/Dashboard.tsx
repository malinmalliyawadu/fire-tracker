import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Plus,
  Flame,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
  Clock
} from "lucide-react";
import { useMemo } from "react";

import DarkVeil from "./DarkVeil";
import { useFireStore } from "../store/fireStore";
import {
  calculateFIREMetrics,
  calculateProgressPercentage,
  formatCurrency,
  convertToMonthlyContribution,
} from "../utils/fireCalculations";

export default function Dashboard() {
  const {
    assets,
    liabilities,
    settings,
    milestones,
    history,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
    addNetWorthSnapshot,
  } = useFireStore();

  const netWorth = getNetWorth();
  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();

  // Debug net worth calculation
  console.log('Net Worth Debug:', {
    totalAssets,
    totalLiabilities,
    netWorth,
    calculation: `${totalAssets} - ${totalLiabilities} = ${totalAssets - totalLiabilities}`
  });

  const monthlyContribution = useMemo(() => {
    const totalAssetContributions = assets.reduce((sum, asset) => {
      return sum + convertToMonthlyContribution(asset.contributions, asset.contributionFrequency);
    }, 0);

    const totalLiabilityPayments = liabilities.reduce((sum, liability) => {
      const frequency = liability.paymentFrequency || "monthly";
      const monthlyPayment = convertToMonthlyContribution(liability.minimumPayment, frequency);
      return sum + monthlyPayment;
    }, 0);

    // Net available for investing after liability payments
    return Math.max(0, totalAssetContributions - totalLiabilityPayments);
  }, [assets, liabilities]);

  const fireMetrics = useMemo(() => {
    return calculateFIREMetrics(netWorth, monthlyContribution, settings, history);
  }, [netWorth, monthlyContribution, settings, history]);

  // Get starting net worth from first snapshot for consistent baseline calculations
  const startingNetWorth = useMemo(() => {
    if (history && history.length > 0) {
      const sortedHistory = history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      console.log('Dashboard History Debug:', {
        historyLength: history.length,
        firstSnapshot: sortedHistory[0],
        allSnapshots: sortedHistory
      });
      return sortedHistory[0].netWorth;
    }
    return 0;
  }, [history]);

  const upcomingMilestones = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => a.targetAmount - b.targetAmount)
    .slice(0, 3);


  // Calculate FIRE streak (days)
  const fireStreak = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-orange-600 dark:from-blue-800 dark:to-orange-800">
        <div className="absolute inset-0">
          <DarkVeil />
        </div>
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="relative py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white">
                  FIRE Dashboard
                </h1>
              </div>
              <p className="text-xl text-white/90 max-w-2xl">
                Track your journey to Financial Independence and Early Retirement
              </p>
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{fireStreak} day streak</span>
                </div>
                <Chip
                  color="warning"
                  variant="flat"
                  className="bg-white/20 text-white border-white/30"
                >
                  {fireMetrics.progressPercentage.toFixed(1)}% to FIRE
                </Chip>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                color="secondary"
                variant="solid"
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                onPress={addNetWorthSnapshot}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                Save Snapshot
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-8 pb-16">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Net Worth Card */}
          <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+2.4%</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Net Worth
                </h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(netWorth, settings.currency)}
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Assets:</span>
                    <span className="font-medium">{formatCurrency(totalAssets, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Liabilities:</span>
                    <span className="font-medium">{formatCurrency(totalLiabilities, settings.currency)}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* FIRE Progress Card */}
          <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <Chip
                  size="sm"
                  color={fireMetrics.progressPercentage >= 25 ? "success" : "warning"}
                  variant="flat"
                >
                  {fireMetrics.progressPercentage >= 25 ? "On Track" : "Building"}
                </Chip>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  FIRE Progress
                </h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {fireMetrics.progressPercentage.toFixed(1)}%
                </div>
                <Progress
                  color="warning"
                  size="lg"
                  value={fireMetrics.progressPercentage}
                  className="w-full"
                  classNames={{
                    indicator: "bg-gradient-to-r from-orange-400 to-red-400"
                  }}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Target: {formatCurrency(fireMetrics.fireNumber, settings.currency)}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Years to FIRE Card */}
          <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Retire at</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{settings.retirementAge}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Years to FIRE
                </h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {fireMetrics.yearsToFIRE === Infinity
                    ? "∞"
                    : `${fireMetrics.yearsToFIRE.toFixed(1)}y`}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  At current contribution rate
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Monthly Contribution Card */}
          <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className={`flex items-center gap-1 ${monthlyContribution >= fireMetrics.monthlyContributionNeeded ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {monthlyContribution >= fireMetrics.monthlyContributionNeeded ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {((monthlyContribution / fireMetrics.monthlyContributionNeeded - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Monthly Target
                </h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(fireMetrics.monthlyContributionNeeded, settings.currency)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(monthlyContribution, settings.currency)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* FIRE Milestones & Progress Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* FIRE Types Overview */}
          <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 xl:col-span-2">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  FIRE Journey Milestones
                </h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 px-6 pb-6">
              {[
                {
                  name: "Lean FIRE",
                  amount: fireMetrics.leanFIRENumber,
                  description: "Minimal expenses lifestyle",
                  color: "green",
                  icon: "🌱",
                  achieved: netWorth >= fireMetrics.leanFIRENumber
                },
                {
                  name: "Coast FIRE",
                  amount: fireMetrics.coastFIRENumber,
                  description: "Let compound interest work",
                  color: "blue",
                  icon: "🌊",
                  achieved: netWorth >= fireMetrics.coastFIRENumber
                },
                {
                  name: "FIRE",
                  amount: fireMetrics.fireNumber,
                  description: "Full financial independence",
                  color: "orange",
                  icon: "🔥",
                  achieved: netWorth >= fireMetrics.fireNumber
                },
                {
                  name: "Fat FIRE",
                  amount: fireMetrics.fatFIRENumber,
                  description: "Comfortable lifestyle",
                  color: "purple",
                  icon: "💎",
                  achieved: netWorth >= fireMetrics.fatFIRENumber
                }
              ].map((milestone, index) => {
                const progress = calculateProgressPercentage(
                  netWorth,
                  milestone.amount,
                  startingNetWorth
                );
                const colorMap: Record<string, string> = {
                  green: "from-green-500 to-emerald-500",
                  blue: "from-blue-500 to-cyan-500",
                  orange: "from-orange-500 to-red-500",
                  purple: "from-purple-500 to-pink-500"
                };

                return (
                  <div key={index} className="group relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${colorMap[milestone.color]} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                    <div className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{milestone.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {milestone.name}
                              </h4>
                              {milestone.achieved && (
                                <Chip size="sm" color="success" variant="flat">
                                  Achieved!
                                </Chip>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(milestone.amount, settings.currency)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {progress.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress
                        size="sm"
                        value={progress}
                        color={milestone.achieved ? "success" : "default"}
                        classNames={{
                          indicator: milestone.achieved
                            ? "bg-gradient-to-r from-green-400 to-emerald-400"
                            : `bg-gradient-to-r ${colorMap[milestone.color]}`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Quick Actions & Milestones */}
          <div className="space-y-6">
            {/* Custom Milestones */}
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Personal Goals
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {upcomingMilestones.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMilestones.map((milestone) => {
                      const progress = calculateProgressPercentage(
                        netWorth,
                        milestone.targetAmount,
                        startingNetWorth
                      );

                      return (
                        <div key={milestone.id} className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {milestone.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(milestone.targetAmount, settings.currency)}
                              </p>
                            </div>
                            <Chip
                              size="sm"
                              color={progress >= 100 ? "success" : progress >= 75 ? "warning" : "default"}
                              variant="flat"
                            >
                              {progress.toFixed(0)}%
                            </Chip>
                          </div>
                          <Progress
                            color={progress >= 100 ? "success" : "primary"}
                            size="sm"
                            value={Math.min(progress, 100)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No custom milestones set
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                      Create milestones to track specific goals
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Quick Stats */}
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quick Stats
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4 px-6 pb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Assets Count</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{assets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Liabilities Count</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{liabilities.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Withdrawal Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{(settings.withdrawalRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Expected Return</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{(settings.expectedReturn * 100).toFixed(1)}%</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
