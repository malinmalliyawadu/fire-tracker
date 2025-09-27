import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import { TrendingUp, DollarSign, Target, Calendar, Plus } from "lucide-react";
import { useMemo } from "react";

import { useFireStore } from "../store/fireStore";
import {
  calculateFIREMetrics,
  formatCurrency,
  convertToMonthlyContribution,
} from "../utils/fireCalculations";

export default function Dashboard() {
  const {
    assets,
    liabilities,
    settings,
    milestones,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
    addNetWorthSnapshot,
  } = useFireStore();

  const netWorth = getNetWorth();
  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();

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
    return calculateFIREMetrics(netWorth, monthlyContribution, settings);
  }, [netWorth, monthlyContribution, settings]);

  const upcomingMilestones = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => a.targetAmount - b.targetAmount)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          FIRE Dashboard
        </h1>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={addNetWorthSnapshot}
        >
          Save Snapshot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Net Worth
            </h3>
            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(netWorth, settings.currency)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Assets: {formatCurrency(totalAssets, settings.currency)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Liabilities: {formatCurrency(totalLiabilities, settings.currency)}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              FIRE Progress
            </h3>
            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {fireMetrics.progressPercentage.toFixed(1)}%
            </div>
            <Progress
              className="mt-2"
              color="success"
              value={fireMetrics.progressPercentage}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Target:{" "}
              {formatCurrency(fireMetrics.fireNumber, settings.currency)}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Years to FIRE
            </h3>
            <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {fireMetrics.yearsToFIRE === Infinity
                ? "∞"
                : fireMetrics.yearsToFIRE.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Retirement age: {settings.retirementAge}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              At current rate
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Monthly Needed
            </h3>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(
                fireMetrics.monthlyContributionNeeded,
                settings.currency,
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Available: {formatCurrency(monthlyContribution, settings.currency)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              To reach FIRE goal
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              FIRE Milestones
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Lean FIRE
                </span>
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {formatCurrency(
                    fireMetrics.leanFIRENumber,
                    settings.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Coast FIRE
                </span>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {formatCurrency(
                    fireMetrics.coastFIRENumber,
                    settings.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  FIRE
                </span>
                <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {formatCurrency(fireMetrics.fireNumber, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Fat FIRE
                </span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  {formatCurrency(fireMetrics.fatFIRENumber, settings.currency)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Milestones
            </h3>
          </CardHeader>
          <CardBody>
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-3">
                {upcomingMilestones.map((milestone) => {
                  const progress = (netWorth / milestone.targetAmount) * 100;

                  return (
                    <div key={milestone.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {milestone.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(
                            milestone.targetAmount,
                            settings.currency,
                          )}
                        </span>
                      </div>
                      <Progress
                        color={progress >= 100 ? "success" : "primary"}
                        size="sm"
                        value={Math.min(progress, 100)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {progress.toFixed(1)}% complete
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No milestones set. Create some milestones to track your
                progress!
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
