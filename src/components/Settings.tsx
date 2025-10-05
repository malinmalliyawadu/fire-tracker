import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import DarkVeil from "./DarkVeil";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Settings as SettingsIcon, Save, RotateCcw, User, Calculator, TrendingUp, Target, DollarSign, RefreshCw } from "lucide-react";

import { useFireStore } from "../store/fireStore";
import { formatPercentage } from "../utils/fireCalculations";

export default function Settings() {
  const { settings, updateSettings, refreshExchangeRate } = useFireStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [form, setForm] = useState({
    fireTarget: settings.fireTarget.toString(),
    withdrawalRate: (settings.withdrawalRate * 100).toString(),
    expectedReturn: (settings.expectedReturn * 100).toString(),
    inflationRate: (settings.inflationRate * 100).toString(),
    retirementAge: settings.retirementAge.toString(),
    currentAge: settings.currentAge.toString(),
    currency: settings.currency,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedSettings = {
      fireTarget: parseFloat(form.fireTarget) || 1000000,
      withdrawalRate: (parseFloat(form.withdrawalRate) || 4) / 100,
      expectedReturn: (parseFloat(form.expectedReturn) || 7) / 100,
      inflationRate: (parseFloat(form.inflationRate) || 3) / 100,
      retirementAge: parseInt(form.retirementAge) || 65,
      currentAge: parseInt(form.currentAge) || 30,
      currency: form.currency,
    };

    updateSettings(updatedSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setForm({
      fireTarget: settings.fireTarget.toString(),
      withdrawalRate: (settings.withdrawalRate * 100).toString(),
      expectedReturn: (settings.expectedReturn * 100).toString(),
      inflationRate: (settings.inflationRate * 100).toString(),
      retirementAge: settings.retirementAge.toString(),
      currentAge: settings.currentAge.toString(),
      currency: settings.currency,
    });
    setHasChanges(false);
  };

  const currencies = [
    { key: "NZD", label: "New Zealand Dollar (NZD)" },
    { key: "USD", label: "US Dollar (USD)" },
    { key: "AUD", label: "Australian Dollar (AUD)" },
    { key: "EUR", label: "Euro (EUR)" },
    { key: "GBP", label: "British Pound (GBP)" },
    { key: "CAD", label: "Canadian Dollar (CAD)" },
  ];

  const handleRefreshExchangeRate = async () => {
    setIsRefreshing(true);
    try {
      await refreshExchangeRate();
    } finally {
      setIsRefreshing(false);
    }
  };

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
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Settings
                  </h1>
                </div>
                <p className="text-xl text-white/90 max-w-2xl">
                  Configure your FIRE journey parameters and calculation assumptions
                </p>
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">FIRE configuration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    <span className="text-sm">Investment assumptions</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {hasChanges && (
                  <Button
                    variant="bordered"
                    size="lg"
                    startContent={<RotateCcw className="h-5 w-5" />}
                    onPress={handleReset}
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  color="secondary"
                  variant="solid"
                  size="lg"
                  isDisabled={!hasChanges}
                  startContent={<Save className="h-5 w-5" />}
                  onPress={handleSave}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 disabled:opacity-50"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-8 pb-16">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* FIRE Goals Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    FIRE Goals
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
            <div className="space-y-4">
              <Input
                description="The total amount you need to achieve financial independence"
                label="FIRE Target Amount"
                placeholder="1000000"
                startContent={<span className="text-gray-500">$</span>}
                type="number"
                value={form.fireTarget}
                onChange={(e) =>
                  handleInputChange("fireTarget", e.target.value)
                }
              />
              <Input
                description="The percentage you plan to withdraw annually in retirement (typically 3-4%)"
                endContent={<span className="text-gray-500">%</span>}
                label="Safe Withdrawal Rate"
                placeholder="4"
                type="number"
                value={form.withdrawalRate}
                onChange={(e) =>
                  handleInputChange("withdrawalRate", e.target.value)
                }
              />
              <Select
                description="Your preferred currency for displaying amounts"
                label="Currency"
                selectedKeys={[form.currency]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  handleInputChange("currency", selected);
                }}
              >
                {currencies.map((currency) => (
                  <SelectItem key={currency.key}>{currency.label}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

            {/* Personal Information Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Personal Information
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
            <div className="space-y-4">
              <Input
                description="Your current age for calculating years to retirement"
                label="Current Age"
                placeholder="30"
                type="number"
                value={form.currentAge}
                onChange={(e) =>
                  handleInputChange("currentAge", e.target.value)
                }
              />
              <Input
                description="The age at which you plan to retire"
                label="Target Retirement Age"
                placeholder="65"
                type="number"
                value={form.retirementAge}
                onChange={(e) =>
                  handleInputChange("retirementAge", e.target.value)
                }
              />
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Years to Retirement: {parseInt(form.retirementAge) - parseInt(form.currentAge)} years
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

            {/* Exchange Rate Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Exchange Rate
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    isLoading={isRefreshing}
                    startContent={!isRefreshing ? <RefreshCw className="w-4 h-4" /> : null}
                    onPress={handleRefreshExchangeRate}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">USD to NZD</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {settings.usdToNzdRate ? settings.usdToNzdRate.toFixed(4) : '1.6500'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last updated</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {settings.exchangeRateLastUpdated
                            ? formatDistanceToNow(new Date(settings.exchangeRateLastUpdated), { addSuffix: true })
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This rate is used for converting USD assets to NZD throughout the app. Click refresh to get the latest exchange rate.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Investment Assumptions Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Investment Assumptions
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
            <div className="space-y-4">
              <Input
                description="Expected annual return on your investments (typically 6-8% for diversified portfolios)"
                endContent={<span className="text-gray-500">%</span>}
                label="Expected Annual Return"
                placeholder="7"
                type="number"
                value={form.expectedReturn}
                onChange={(e) =>
                  handleInputChange("expectedReturn", e.target.value)
                }
              />
              <Input
                description="Expected annual inflation rate (typically 2-3%)"
                endContent={<span className="text-gray-500">%</span>}
                label="Annual Inflation Rate"
                placeholder="3"
                type="number"
                value={form.inflationRate}
                onChange={(e) =>
                  handleInputChange("inflationRate", e.target.value)
                }
              />
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Real Return: {formatPercentage((parseFloat(form.expectedReturn) - parseFloat(form.inflationRate)) / 100)} annually
                  </p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  This is your expected return after accounting for inflation
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

            {/* FIRE Calculations Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 xl:col-span-2">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    FIRE Calculations
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Lean FIRE (60%)
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-800 dark:text-green-200">
                      ${(parseFloat(form.fireTarget) * 0.6 || 600000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Regular FIRE (100%)
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      ${(parseFloat(form.fireTarget) || 1000000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Fat FIRE (150%)
                      </span>
                    </div>
                    <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      ${(parseFloat(form.fireTarget) * 1.5 || 1500000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        Annual Income at FIRE
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        ${(((parseFloat(form.fireTarget) || 1000000) * (parseFloat(form.withdrawalRate) || 4)) / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        at {form.withdrawalRate}% withdrawal
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <Card className="border border-orange-200/50 dark:border-orange-700/50 shadow-xl backdrop-blur-sm bg-gradient-to-r from-orange-50/80 to-yellow-50/80 dark:from-orange-900/20 dark:to-yellow-900/20">
              <CardBody className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500">
                      <Save className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                        You have unsaved changes
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Don't forget to save your settings before navigating away
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleReset}
                      className="hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      Reset
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={handleSave}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                    >
                      Save Now
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
