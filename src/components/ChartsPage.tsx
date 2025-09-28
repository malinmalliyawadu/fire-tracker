import { useState } from "react";
import { BarChart3, Filter, X, TrendingUp, Activity, PieChart } from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

import {
  FIREProjectionChart,
  AssetAllocationChart,
  NetWorthHistoryChart,
} from "./Charts";
import { useFireStore } from "../store/fireStore";
import type { AssetType, LiabilityType } from "../types/fire";

interface ChartFilters {
  assetTypes: AssetType[];
  liabilityTypes: LiabilityType[];
  selectedAssets: string[];
  selectedLiabilities: string[];
}

export default function ChartsPage() {
  const { assets, liabilities } = useFireStore();

  const [filters, setFilters] = useState<ChartFilters>({
    assetTypes: [],
    liabilityTypes: [],
    selectedAssets: [],
    selectedLiabilities: [],
  });

  const [showFilters, setShowFilters] = useState(false);

  const assetTypeOptions = [
    { key: "individual-stock", label: "Individual Stocks" },
    { key: "kiwisaver", label: "KiwiSaver" },
    { key: "savings-account", label: "Savings Account" },
    { key: "term-deposit", label: "Term Deposit" },
    { key: "bitcoin", label: "Bitcoin" },
    { key: "ethereum", label: "Ethereum" },
    { key: "other", label: "Other" },
  ];

  const liabilityTypeOptions = [
    { key: "mortgage", label: "Mortgage" },
    { key: "car-loan", label: "Car Loan" },
    { key: "student-loan", label: "Student Loan" },
    { key: "credit-card", label: "Credit Card" },
    { key: "personal-loan", label: "Personal Loan" },
    { key: "hire-purchase", label: "Hire Purchase" },
    { key: "overdraft", label: "Overdraft" },
    { key: "other", label: "Other" },
  ];

  const clearAllFilters = () => {
    setFilters({
      assetTypes: [],
      liabilityTypes: [],
      selectedAssets: [],
      selectedLiabilities: [],
    });
  };

  const hasActiveFilters =
    filters.assetTypes.length > 0 ||
    filters.liabilityTypes.length > 0 ||
    filters.selectedAssets.length > 0 ||
    filters.selectedLiabilities.length > 0;

  const removeAssetTypeFilter = (assetType: AssetType) => {
    setFilters(prev => ({
      ...prev,
      assetTypes: prev.assetTypes.filter(t => t !== assetType),
    }));
  };

  const removeLiabilityTypeFilter = (liabilityType: LiabilityType) => {
    setFilters(prev => ({
      ...prev,
      liabilityTypes: prev.liabilityTypes.filter(t => t !== liabilityType),
    }));
  };

  const removeAssetFilter = (assetId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAssets: prev.selectedAssets.filter(id => id !== assetId),
    }));
  };

  const removeLiabilityFilter = (liabilityId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedLiabilities: prev.selectedLiabilities.filter(id => id !== liabilityId),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-orange-600 dark:from-blue-800 dark:to-orange-800">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="relative py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Charts & Analytics
                  </h1>
                </div>
                <p className="text-xl text-white/90 max-w-2xl">
                  Visualize your financial journey and track your progress toward FIRE
                </p>
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{assets.length} assets tracked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">{liabilities.length} liabilities monitored</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant={showFilters ? "solid" : "bordered"}
                  color={hasActiveFilters ? "secondary" : "secondary"}
                  size="lg"
                  startContent={<Filter className="h-5 w-5" />}
                  onPress={() => setShowFilters(!showFilters)}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  Filters {hasActiveFilters && `(${filters.assetTypes.length + filters.liabilityTypes.length + filters.selectedAssets.length + filters.selectedLiabilities.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-8 pb-16">

          {/* Filters Section */}
          {showFilters && (
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Chart Filters
                    </h3>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={clearAllFilters}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody className="space-y-6 px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Asset Types"
                placeholder="Filter by asset type"
                selectionMode="multiple"
                selectedKeys={filters.assetTypes}
                onSelectionChange={(keys) =>
                  setFilters(prev => ({
                    ...prev,
                    assetTypes: Array.from(keys) as AssetType[]
                  }))
                }
              >
                {assetTypeOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Liability Types"
                placeholder="Filter by liability type"
                selectionMode="multiple"
                selectedKeys={filters.liabilityTypes}
                onSelectionChange={(keys) =>
                  setFilters(prev => ({
                    ...prev,
                    liabilityTypes: Array.from(keys) as LiabilityType[]
                  }))
                }
              >
                {liabilityTypeOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Specific Assets"
                placeholder="Filter specific assets"
                selectionMode="multiple"
                selectedKeys={filters.selectedAssets}
                onSelectionChange={(keys) =>
                  setFilters(prev => ({
                    ...prev,
                    selectedAssets: Array.from(keys) as string[]
                  }))
                }
              >
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Specific Liabilities"
                placeholder="Filter specific liabilities"
                selectionMode="multiple"
                selectedKeys={filters.selectedLiabilities}
                onSelectionChange={(keys) =>
                  setFilters(prev => ({
                    ...prev,
                    selectedLiabilities: Array.from(keys) as string[]
                  }))
                }
              >
                {liabilities.map((liability) => (
                  <SelectItem key={liability.id} value={liability.id}>
                    {liability.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

                {hasActiveFilters && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.assetTypes.map((type) => (
                        <Chip
                          key={type}
                          color="primary"
                          variant="flat"
                          onClose={() => removeAssetTypeFilter(type)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          {assetTypeOptions.find(opt => opt.key === type)?.label}
                        </Chip>
                      ))}
                      {filters.liabilityTypes.map((type) => (
                        <Chip
                          key={type}
                          color="danger"
                          variant="flat"
                          onClose={() => removeLiabilityTypeFilter(type)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {liabilityTypeOptions.find(opt => opt.key === type)?.label}
                        </Chip>
                      ))}
                      {filters.selectedAssets.map((assetId) => (
                        <Chip
                          key={assetId}
                          color="success"
                          variant="flat"
                          onClose={() => removeAssetFilter(assetId)}
                          className="hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          {assets.find(asset => asset.id === assetId)?.name}
                        </Chip>
                      ))}
                      {filters.selectedLiabilities.map((liabilityId) => (
                        <Chip
                          key={liabilityId}
                          color="warning"
                          variant="flat"
                          onClose={() => removeLiabilityFilter(liabilityId)}
                          className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                          {liabilities.find(liability => liability.id === liabilityId)?.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Charts Section */}
          <div className="space-y-8">
            <FIREProjectionChart filters={filters} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <AssetAllocationChart filters={filters} />
              <NetWorthHistoryChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}