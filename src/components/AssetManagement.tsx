import type {
  Asset,
  Liability,
  AssetType,
  AccountType,
  LiabilityType,
  ContributionFrequency,
} from "../types/fire";

import { useState } from "react";

import DarkVeil from "./DarkVeil";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

import { useFireStore } from "../store/fireStore";
import { formatCurrency } from "../utils/fireCalculations";
import { convertAssetValue } from "../utils/currencyUtils";

export default function AssetManagement() {
  const {
    assets,
    liabilities,
    settings,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
  } = useFireStore();

  const {
    isOpen: isAssetModalOpen,
    onOpen: onAssetModalOpen,
    onOpenChange: onAssetModalOpenChange,
  } = useDisclosure();
  const {
    isOpen: isLiabilityModalOpen,
    onOpen: onLiabilityModalOpen,
    onOpenChange: onLiabilityModalOpenChange,
  } = useDisclosure();

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(
    null,
  );

  const [assetForm, setAssetForm] = useState({
    name: "",
    type: "individual-stock" as AssetType,
    accountType: "investment" as AccountType,
    value: "",
    contributions: "",
    contributionFrequency: "monthly" as ContributionFrequency,
    notes: "",
    stockSymbol: "",
    stockCurrency: "USD" as "NZD" | "USD",
    quantity: "", // Only for crypto
    interestRate: "",
    maturityDate: "",
    kiwiSaverProvider: "",
    kiwiSaverFund: "",
    autoUpdate: false,
  });

  const [liabilityForm, setLiabilityForm] = useState({
    name: "",
    type: "mortgage" as LiabilityType,
    balance: "",
    interestRate: "",
    minimumPayment: "",
    paymentFrequency: "monthly" as ContributionFrequency,
    notes: "",
  });

  const handleAssetSubmit = () => {
    const assetData = {
      name: assetForm.name,
      type: assetForm.type,
      accountType: assetForm.accountType,
      value: parseFloat(assetForm.value) || 0,
      contributions: parseFloat(assetForm.contributions) || 0,
      contributionFrequency: assetForm.contributionFrequency,
      notes: assetForm.notes || undefined,
      stockSymbol: assetForm.stockSymbol || undefined,
      stockCurrency: assetForm.type === "individual-stock" ? assetForm.stockCurrency : undefined,
      quantity: parseFloat(assetForm.quantity) || undefined,
      interestRate: parseFloat(assetForm.interestRate) || undefined,
      maturityDate: assetForm.maturityDate || undefined,
      kiwiSaverProvider: assetForm.kiwiSaverProvider || undefined,
      kiwiSaverFund: assetForm.kiwiSaverFund || undefined,
      autoUpdate: assetForm.autoUpdate,
    };

    if (editingAsset) {
      updateAsset(editingAsset.id, assetData);
    } else {
      addAsset(assetData);
    }

    resetAssetForm();
    onAssetModalOpenChange();
  };

  const handleLiabilitySubmit = () => {
    const liabilityData = {
      name: liabilityForm.name,
      type: liabilityForm.type,
      balance: parseFloat(liabilityForm.balance) || 0,
      interestRate: parseFloat(liabilityForm.interestRate) || 0,
      minimumPayment: parseFloat(liabilityForm.minimumPayment) || 0,
      paymentFrequency: liabilityForm.paymentFrequency,
      notes: liabilityForm.notes || undefined,
    };

    if (editingLiability) {
      updateLiability(editingLiability.id, liabilityData);
    } else {
      addLiability(liabilityData);
    }

    resetLiabilityForm();
    onLiabilityModalOpenChange();
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: "",
      type: "individual-stock",
      accountType: "investment",
      value: "",
      contributions: "",
      contributionFrequency: "monthly",
      notes: "",
      stockSymbol: "",
      stockCurrency: "USD",
      quantity: "",
      interestRate: "",
      maturityDate: "",
      kiwiSaverProvider: "",
      kiwiSaverFund: "",
      autoUpdate: false,
    });
    setEditingAsset(null);
  };

  const resetLiabilityForm = () => {
    setLiabilityForm({
      name: "",
      type: "mortgage",
      balance: "",
      interestRate: "",
      minimumPayment: "",
      paymentFrequency: "monthly",
      notes: "",
    });
    setEditingLiability(null);
  };

  const openAssetModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm({
        name: asset.name,
        type: asset.type,
        accountType: asset.accountType,
        value: asset.value.toString(),
        contributions: asset.contributions.toString(),
        contributionFrequency: asset.contributionFrequency || "monthly",
        notes: asset.notes || "",
        stockSymbol: asset.stockSymbol || "",
        stockCurrency: asset.stockCurrency || "USD",
        quantity: asset.quantity?.toString() || "",
        interestRate: asset.interestRate?.toString() || "",
        maturityDate: asset.maturityDate || "",
        kiwiSaverProvider: asset.kiwiSaverProvider || "",
        kiwiSaverFund: asset.kiwiSaverFund || "",
        autoUpdate: asset.autoUpdate || false,
      });
    } else {
      resetAssetForm();
    }
    onAssetModalOpen();
  };

  const openLiabilityModal = (liability?: Liability) => {
    if (liability) {
      setEditingLiability(liability);
      setLiabilityForm({
        name: liability.name,
        type: liability.type,
        balance: liability.balance.toString(),
        interestRate: liability.interestRate.toString(),
        minimumPayment: liability.minimumPayment.toString(),
        paymentFrequency: liability.paymentFrequency || "monthly",
        notes: liability.notes || "",
      });
    } else {
      resetLiabilityForm();
    }
    onLiabilityModalOpen();
  };

  const assetTypes: { key: AssetType; label: string; description: string }[] = [
    {
      key: "individual-stock",
      label: "Individual Stock",
      description: "Specific company shares (e.g., Apple, Tesla)",
    },
    {
      key: "kiwisaver",
      label: "KiwiSaver",
      description: "NZ retirement savings scheme",
    },
    {
      key: "savings-account",
      label: "Savings Account",
      description: "Bank savings with interest",
    },
    {
      key: "term-deposit",
      label: "Term Deposit",
      description: "Fixed-term investment",
    },
    {
      key: "bitcoin",
      label: "Bitcoin (BTC)",
      description: "Bitcoin cryptocurrency",
    },
    {
      key: "ethereum",
      label: "Ethereum (ETH)",
      description: "Ethereum cryptocurrency",
    },
    { key: "other", label: "Other", description: "Other investment types" },
  ];

  const accountTypes: { key: AccountType; label: string }[] = [
    { key: "kiwisaver", label: "KiwiSaver" },
    { key: "investment", label: "Investment Account" },
    { key: "savings", label: "Savings Account" },
    { key: "term-deposit", label: "Term Deposit" },
    { key: "shares", label: "Share Trading Account" },
    { key: "managed-funds", label: "Managed Funds" },
    { key: "property", label: "Property Investment" },
    { key: "other", label: "Other" },
  ];

  const liabilityTypes: { key: LiabilityType; label: string }[] = [
    { key: "mortgage", label: "Mortgage" },
    { key: "car-loan", label: "Car Loan" },
    { key: "student-loan", label: "Student Loan" },
    { key: "credit-card", label: "Credit Card" },
    { key: "personal-loan", label: "Personal Loan" },
    { key: "hire-purchase", label: "Hire Purchase" },
    { key: "overdraft", label: "Overdraft" },
    { key: "other", label: "Other" },
  ];

  const getAssetDetails = (asset: Asset): string => {
    switch (asset.type) {
      case "individual-stock":
        return `${asset.stockSymbol || "N/A"}${asset.stockCurrency ? ` (${asset.stockCurrency})` : ""}`;
      case "kiwisaver":
        return `${asset.kiwiSaverProvider || "N/A"}${asset.kiwiSaverFund ? ` • ${asset.kiwiSaverFund}` : ""}`;
      case "savings-account":
      case "term-deposit":
        return `${asset.interestRate ? `${asset.interestRate}% APR` : "No rate set"}${asset.maturityDate && asset.type === "term-deposit" ? ` • Matures ${new Date(asset.maturityDate).toLocaleDateString()}` : ""}`;
      case "bitcoin":
        return `${asset.quantity || 0} BTC`;
      case "ethereum":
        return `${asset.quantity || 0} ETH`;
      default:
        return (
          accountTypes.find((t) => t.key === asset.accountType)?.label || "N/A"
        );
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
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Assets & Liabilities
                  </h1>
                </div>
                <p className="text-xl text-white/90 max-w-2xl">
                  Manage your financial portfolio and track your net worth
                </p>
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{assets.length} assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm">{liabilities.length} liabilities</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  color="secondary"
                  variant="solid"
                  size="lg"
                  startContent={<Plus className="h-5 w-5" />}
                  onPress={() => openAssetModal()}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  Add Asset
                </Button>
                <Button
                  color="secondary"
                  variant="solid"
                  size="lg"
                  startContent={<Plus className="h-5 w-5" />}
                  onPress={() => openLiabilityModal()}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  Add Liability
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Assets Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Assets</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{assets.length}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Assets
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(getTotalAssets(), settings.currency)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current portfolio value
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Total Liabilities Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Debts</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{liabilities.length}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Liabilities
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(getTotalLiabilities(), settings.currency)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Outstanding balances
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Net Worth Card */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className={`flex items-center gap-1 ${getNetWorth() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {getNetWorth() >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">Net</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Net Worth
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(getNetWorth(), settings.currency)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Assets minus liabilities
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Assets & Liabilities Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Assets Table */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Assets
                    </h3>
                  </div>
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => openAssetModal()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  >
                    Add Asset
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {assets.length > 0 ? (
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <div key={asset.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {asset.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {assetTypes.find((t) => t.key === asset.type)?.label || asset.type}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(convertAssetValue(asset, settings.currency), settings.currency)}
                              </div>
                              {asset.stockCurrency === "USD" && settings.currency !== "USD" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatCurrency(asset.value, "USD")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {getAssetDetails(asset)}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => openAssetModal(asset)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={() => deleteAsset(asset.id)}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                      No assets yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                      Start building your portfolio by adding your first asset
                    </p>
                    <Button
                      color="primary"
                      onPress={() => openAssetModal()}
                      startContent={<Plus className="h-4 w-4" />}
                    >
                      Add Your First Asset
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Liabilities Table */}
            <Card className="border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Liabilities
                    </h3>
                  </div>
                  <Button
                    color="danger"
                    size="sm"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => openLiabilityModal()}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white"
                  >
                    Add Liability
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {liabilities.length > 0 ? (
                  <div className="space-y-4">
                    {liabilities.map((liability) => (
                      <div key={liability.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {liability.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {liability.type.replace("-", " ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(liability.balance, settings.currency)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {liability.interestRate}% APR
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(liability.minimumPayment, settings.currency)} {liability.paymentFrequency || 'monthly'}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => openLiabilityModal(liability)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={() => deleteLiability(liability.id)}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingDown className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                      No liabilities yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                      Track debts and loans to get a complete financial picture
                    </p>
                    <Button
                      color="danger"
                      onPress={() => openLiabilityModal()}
                      startContent={<Plus className="h-4 w-4" />}
                    >
                      Add Your First Liability
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Asset Modal */}
      <Modal isOpen={isAssetModalOpen} onOpenChange={onAssetModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingAsset ? "Edit Asset" : "Add Asset"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Asset Name"
                    placeholder="e.g., Emergency Fund, Property Investment"
                    value={assetForm.name}
                    onChange={(e) =>
                      setAssetForm({ ...assetForm, name: e.target.value })
                    }
                  />
                  <Select
                    description="Select the specific type of asset you want to track"
                    label="Asset Type"
                    placeholder="Choose asset type"
                    selectedKeys={[assetForm.type]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as AssetType;

                      setAssetForm({ ...assetForm, type: selected });
                    }}
                  >
                    {assetTypes.map((type) => (
                      <SelectItem key={type.key} description={type.description}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Account Type"
                    selectedKeys={[assetForm.accountType]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as AccountType;

                      setAssetForm({ ...assetForm, accountType: selected });
                    }}
                  >
                    {accountTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    label={`Current Value (${assetForm.type === "individual-stock" ? assetForm.stockCurrency : "NZD"})`}
                    placeholder="0"
                    startContent={<span className="text-gray-500">{assetForm.type === "individual-stock" && assetForm.stockCurrency === "USD" ? "USD $" : "NZD $"}</span>}
                    type="number"
                    value={assetForm.value}
                    onChange={(e) =>
                      setAssetForm({ ...assetForm, value: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Contribution Amount"
                      placeholder="0"
                      startContent={<span className="text-gray-500">$</span>}
                      type="number"
                      value={assetForm.contributions}
                      onChange={(e) =>
                        setAssetForm({
                          ...assetForm,
                          contributions: e.target.value,
                        })
                      }
                    />
                    <Select
                      label="Frequency"
                      selectedKeys={[assetForm.contributionFrequency]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as ContributionFrequency;
                        setAssetForm({ ...assetForm, contributionFrequency: selected });
                      }}
                    >
                      <SelectItem key="weekly">Weekly</SelectItem>
                      <SelectItem key="fortnightly">Fortnightly</SelectItem>
                      <SelectItem key="monthly">Monthly</SelectItem>
                      <SelectItem key="quarterly">Quarterly</SelectItem>
                      <SelectItem key="annually">Annually</SelectItem>
                    </Select>
                  </div>

                  {/* Conditional fields based on asset type */}
                  {assetForm.type === "individual-stock" && (
                    <>
                      <Input
                        description="Enter the stock ticker symbol"
                        label="Stock Symbol"
                        placeholder="e.g., AAPL, TSLA, GOOGL"
                        value={assetForm.stockSymbol}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            stockSymbol: e.target.value,
                          })
                        }
                      />
                      <Select
                        description="Currency for stock value"
                        label="Currency"
                        selectedKeys={[assetForm.stockCurrency]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as "NZD" | "USD";
                          setAssetForm({ ...assetForm, stockCurrency: selected });
                        }}
                      >
                        <SelectItem key="USD">USD</SelectItem>
                        <SelectItem key="NZD">NZD</SelectItem>
                      </Select>
                      <Switch
                        isSelected={assetForm.autoUpdate}
                        onValueChange={(value) =>
                          setAssetForm({ ...assetForm, autoUpdate: value })
                        }
                      >
                        Auto-update with live prices
                      </Switch>
                    </>
                  )}

                  {assetForm.type === "kiwisaver" && (
                    <>
                      <Select
                        label="KiwiSaver Provider"
                        placeholder="Select your provider"
                        selectedKeys={
                          assetForm.kiwiSaverProvider
                            ? [assetForm.kiwiSaverProvider]
                            : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setAssetForm({
                            ...assetForm,
                            kiwiSaverProvider: selected,
                          });
                        }}
                      >
                        <SelectItem key="anz">ANZ</SelectItem>
                        <SelectItem key="asb">ASB</SelectItem>
                        <SelectItem key="westpac">Westpac</SelectItem>
                        <SelectItem key="bnz">BNZ</SelectItem>
                        <SelectItem key="simplicity">Simplicity</SelectItem>
                        <SelectItem key="fisher-funds">Fisher Funds</SelectItem>
                        <SelectItem key="milford">
                          Milford Asset Management
                        </SelectItem>
                        <SelectItem key="generate">Generate</SelectItem>
                        <SelectItem key="other">Other</SelectItem>
                      </Select>
                      <Input
                        description="The specific KiwiSaver fund you're invested in"
                        label="Fund Name"
                        placeholder="e.g., Growth Fund, Conservative Fund"
                        value={assetForm.kiwiSaverFund}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            kiwiSaverFund: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  {(assetForm.type === "savings-account" ||
                    assetForm.type === "term-deposit") && (
                    <>
                      <Input
                        description="Annual interest rate (%)"
                        endContent={<span className="text-gray-500">%</span>}
                        label="Interest Rate"
                        placeholder="2.5"
                        type="number"
                        value={assetForm.interestRate}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            interestRate: e.target.value,
                          })
                        }
                      />
                      {assetForm.type === "term-deposit" && (
                        <Input
                          description="When does the term deposit mature?"
                          label="Maturity Date"
                          type="date"
                          value={assetForm.maturityDate}
                          onChange={(e) =>
                            setAssetForm({
                              ...assetForm,
                              maturityDate: e.target.value,
                            })
                          }
                        />
                      )}
                    </>
                  )}

                  {(assetForm.type === "bitcoin" ||
                    assetForm.type === "ethereum") && (
                    <>
                      <Input
                        description={`Amount of ${assetForm.type === "bitcoin" ? "Bitcoin" : "Ethereum"} owned`}
                        label="Quantity"
                        placeholder="0.1"
                        type="number"
                        value={assetForm.quantity}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            quantity: e.target.value,
                          })
                        }
                      />
                      <Switch
                        isSelected={assetForm.autoUpdate}
                        onValueChange={(value) =>
                          setAssetForm({ ...assetForm, autoUpdate: value })
                        }
                      >
                        Auto-update with live prices
                      </Switch>
                    </>
                  )}

                  <Input
                    label="Notes (Optional)"
                    placeholder="Additional notes about this asset"
                    value={assetForm.notes}
                    onChange={(e) =>
                      setAssetForm({ ...assetForm, notes: e.target.value })
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleAssetSubmit}>
                  {editingAsset ? "Update" : "Add"} Asset
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Liability Modal */}
      <Modal
        isOpen={isLiabilityModalOpen}
        onOpenChange={onLiabilityModalOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingLiability ? "Edit Liability" : "Add Liability"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Liability Name"
                    placeholder="e.g., Home Mortgage, Car Loan"
                    value={liabilityForm.name}
                    onChange={(e) =>
                      setLiabilityForm({
                        ...liabilityForm,
                        name: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Liability Type"
                    selectedKeys={[liabilityForm.type]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as LiabilityType;

                      setLiabilityForm({ ...liabilityForm, type: selected });
                    }}
                  >
                    {liabilityTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Current Balance"
                    placeholder="0"
                    startContent={<span className="text-gray-500">$</span>}
                    type="number"
                    value={liabilityForm.balance}
                    onChange={(e) =>
                      setLiabilityForm({
                        ...liabilityForm,
                        balance: e.target.value,
                      })
                    }
                  />
                  <Input
                    endContent={<span className="text-gray-500">%</span>}
                    label="Interest Rate"
                    placeholder="0"
                    type="number"
                    value={liabilityForm.interestRate}
                    onChange={(e) =>
                      setLiabilityForm({
                        ...liabilityForm,
                        interestRate: e.target.value,
                      })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Payment Amount"
                      placeholder="0"
                      startContent={<span className="text-gray-500">$</span>}
                      type="number"
                      value={liabilityForm.minimumPayment}
                      onChange={(e) =>
                        setLiabilityForm({
                          ...liabilityForm,
                          minimumPayment: e.target.value,
                        })
                      }
                    />
                    <Select
                      label="Payment Frequency"
                      selectedKeys={[liabilityForm.paymentFrequency]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as ContributionFrequency;
                        setLiabilityForm({ ...liabilityForm, paymentFrequency: selected });
                      }}
                    >
                      <SelectItem key="weekly">Weekly</SelectItem>
                      <SelectItem key="fortnightly">Fortnightly</SelectItem>
                      <SelectItem key="monthly">Monthly</SelectItem>
                      <SelectItem key="quarterly">Quarterly</SelectItem>
                      <SelectItem key="annually">Annually</SelectItem>
                    </Select>
                  </div>
                  <Input
                    label="Notes (Optional)"
                    placeholder="Additional notes about this liability"
                    value={liabilityForm.notes}
                    onChange={(e) =>
                      setLiabilityForm({
                        ...liabilityForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleLiabilitySubmit}>
                  {editingLiability ? "Update" : "Add"} Liability
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
