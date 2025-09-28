import type {
  Asset,
  Liability,
  AssetType,
  AccountType,
  LiabilityType,
  ContributionFrequency,
} from "../types/fire";

import { useState } from "react";
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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

import { useFireStore } from "../store/fireStore";
import { formatCurrency, getFrequencyLabel } from "../utils/fireCalculations";
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Assets & Liabilities
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Assets
            </h3>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getTotalAssets(), settings.currency)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {assets.length} assets
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Liabilities
            </h3>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(getTotalLiabilities(), settings.currency)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {liabilities.length} liabilities
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Net Worth
            </h3>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getNetWorth(), settings.currency)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Assets minus liabilities
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assets
            </h3>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => openAssetModal()}
            >
              Add Asset
            </Button>
          </CardHeader>
          <CardBody>
            {assets.length > 0 ? (
              <Table aria-label="Assets table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DETAILS</TableColumn>
                  <TableColumn>VALUE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {asset.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {
                              accountTypes.find(
                                (t) => t.key === asset.accountType,
                              )?.label
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700 dark:text-gray-300">
                          {assetTypes.find((t) => t.key === asset.type)
                            ?.label || asset.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getAssetDetails(asset)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(convertAssetValue(asset, settings.currency), settings.currency)}
                          </span>
                          {asset.stockCurrency === "USD" && settings.currency !== "USD" && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(asset.value, "USD")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => openAssetModal(asset)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => deleteAsset(asset.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-gray-200 dark:border-gray-700">
                    <TableCell>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Total Assets
                      </p>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(getTotalAssets(), settings.currency)}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No assets added yet. Click &quot;Add Asset&quot; to get started.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Liabilities
            </h3>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => openLiabilityModal()}
            >
              Add Liability
            </Button>
          </CardHeader>
          <CardBody>
            {liabilities.length > 0 ? (
              <Table aria-label="Liabilities table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>BALANCE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {liabilities.map((liability) => (
                    <TableRow key={liability.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {liability.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-gray-700 dark:text-gray-300">
                          {liability.type.replace("-", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(liability.balance, settings.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => openLiabilityModal(liability)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => deleteLiability(liability.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No liabilities added yet. Click &quot;Add Liability&quot; to get
                started.
              </p>
            )}
          </CardBody>
        </Card>
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
