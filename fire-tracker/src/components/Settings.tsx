import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Settings as SettingsIcon, Save, RotateCcw } from "lucide-react";

import { useFireStore } from "../store/fireStore";
import { formatPercentage } from "../utils/fireCalculations";

export default function Settings() {
  const { settings, updateSettings } = useFireStore();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              startContent={<RotateCcw className="h-4 w-4" />}
              variant="light"
              onPress={handleReset}
            >
              Reset
            </Button>
          )}
          <Button
            color="primary"
            isDisabled={!hasChanges}
            startContent={<Save className="h-4 w-4" />}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              FIRE Goals
            </h3>
          </CardHeader>
          <CardBody>
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

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
          </CardHeader>
          <CardBody>
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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Years to Retirement:</strong>{" "}
                  {parseInt(form.retirementAge) - parseInt(form.currentAge)}{" "}
                  years
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Investment Assumptions
            </h3>
          </CardHeader>
          <CardBody>
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
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Real Return:</strong>{" "}
                  {formatPercentage(
                    (parseFloat(form.expectedReturn) -
                      parseFloat(form.inflationRate)) /
                      100,
                  )}{" "}
                  annually
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  This is your expected return after accounting for inflation
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              FIRE Calculations
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Lean FIRE (60%)
                </span>
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  $
                  {(
                    parseFloat(form.fireTarget) * 0.6 || 600000
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Regular FIRE (100%)
                </span>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  ${(parseFloat(form.fireTarget) || 1000000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Fat FIRE (150%)
                </span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  $
                  {(
                    parseFloat(form.fireTarget) * 1.5 || 1500000
                  ).toLocaleString()}
                </span>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Annual Income at FIRE:</strong> $
                  {(
                    ((parseFloat(form.fireTarget) || 1000000) *
                      (parseFloat(form.withdrawalRate) || 4)) /
                    100
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Based on your withdrawal rate of {form.withdrawalRate}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {hasChanges && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  You have unsaved changes
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Don&apos;t forget to save your settings before navigating away
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="light" onPress={handleReset}>
                  Reset
                </Button>
                <Button color="primary" size="sm" onPress={handleSave}>
                  Save Now
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
