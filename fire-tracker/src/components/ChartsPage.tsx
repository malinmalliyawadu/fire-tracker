import { useState } from "react";
import { BarChart3, Filter, X } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Charts & Analytics
          </h1>
        </div>

        <Button
          variant={showFilters ? "solid" : "bordered"}
          color={hasActiveFilters ? "primary" : "default"}
          startContent={<Filter className="h-4 w-4" />}
          onPress={() => setShowFilters(!showFilters)}
        >
          Filters {hasActiveFilters && `(${filters.assetTypes.length + filters.liabilityTypes.length + filters.selectedAssets.length + filters.selectedLiabilities.length})`}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Chart Filters</h3>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={clearAllFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
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
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.assetTypes.map((type) => (
                    <Chip
                      key={type}
                      color="primary"
                      variant="flat"
                      onClose={() => removeAssetTypeFilter(type)}
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

      <div className="space-y-6">
        <FIREProjectionChart filters={filters} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocationChart filters={filters} />
          <NetWorthHistoryChart />
        </div>
      </div>
    </div>
  );
}