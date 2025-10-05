import type { Milestone } from "../types/fire";

import { useState } from "react";

import DarkVeil from "./DarkVeil";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Progress } from "@heroui/progress";
import {
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Target,
  Award,
  Star,
  TrendingUp,
} from "lucide-react";

import { useFireStore } from "../store/fireStore";
import {
  formatCurrency,
  calculateLeanFIRE,
  calculateFatFIRE,
  calculateCoastFIRE,
  calculateFIRENumber
} from "../utils/fireCalculations";

export default function Milestones() {
  const {
    milestones,
    settings,
    getNetWorth,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    achieveMilestone,
  } = useFireStore();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    description: "",
  });

  const [selectedDefaultMilestone, setSelectedDefaultMilestone] = useState("");

  const netWorth = getNetWorth();

  // Define default milestone options
  const getDefaultMilestones = () => {
    const fireNumber = calculateFIRENumber(settings);
    const leanFire = calculateLeanFIRE(settings);
    const fatFire = calculateFatFIRE(settings);
    const coastFire = calculateCoastFIRE(settings);

    return [
      {
        key: "custom",
        name: "Custom Milestone",
        targetAmount: 0,
        description: "Create your own milestone"
      },
      {
        key: "break-even",
        name: "Break Even",
        targetAmount: 0,
        description: "Reaching $0 net worth - debt free!"
      },
      {
        key: "first-10k",
        name: "First $10k",
        targetAmount: 10000,
        description: "Building initial savings momentum"
      },
      {
        key: "first-50k",
        name: "First $50k",
        targetAmount: 50000,
        description: "Significant savings milestone"
      },
      {
        key: "first-100k",
        name: "First $100k",
        targetAmount: 100000,
        description: "The hardest milestone - building initial momentum"
      },
      {
        key: "coast-fire",
        name: "Coast FIRE",
        targetAmount: Math.round(coastFire),
        description: "Let compound interest work until retirement"
      },
      {
        key: "lean-fire",
        name: "Lean FIRE",
        targetAmount: Math.round(leanFire),
        description: "Minimal expenses lifestyle"
      },
      {
        key: "quarter-million",
        name: "Quarter Million",
        targetAmount: 250000,
        description: "Major milestone on path to FIRE"
      },
      {
        key: "half-million",
        name: "Half Million",
        targetAmount: 500000,
        description: "Halfway to standard FIRE target"
      },
      {
        key: "fire",
        name: "FIRE",
        targetAmount: Math.round(fireNumber),
        description: "Full financial independence"
      },
      {
        key: "fat-fire",
        name: "Fat FIRE",
        targetAmount: Math.round(fatFire),
        description: "Comfortable lifestyle with higher expenses"
      },
      {
        key: "million",
        name: "First Million",
        targetAmount: 1000000,
        description: "Millionaire status"
      }
    ];
  };

  const handleSubmit = () => {
    const milestoneData = {
      name: form.name,
      targetAmount: parseFloat(form.targetAmount) || 0,
      targetDate: form.targetDate || undefined,
      achieved: false,
      description: form.description || undefined,
    };

    if (editingMilestone) {
      updateMilestone(editingMilestone.id, milestoneData);
    } else {
      addMilestone(milestoneData);
    }

    resetForm();
    onOpenChange();
  };

  const resetForm = () => {
    setForm({
      name: "",
      targetAmount: "",
      targetDate: "",
      description: "",
    });
    setEditingMilestone(null);
    setSelectedDefaultMilestone("");
  };

  const handleDefaultMilestoneSelect = (selectedKey: string) => {
    setSelectedDefaultMilestone(selectedKey);

    if (selectedKey && selectedKey !== "custom") {
      const defaultMilestones = getDefaultMilestones();
      const selectedMilestone = defaultMilestones.find(m => m.key === selectedKey);

      if (selectedMilestone) {
        setForm({
          name: selectedMilestone.name,
          targetAmount: selectedMilestone.targetAmount.toString(),
          targetDate: "",
          description: selectedMilestone.description,
        });
      }
    } else if (selectedKey === "custom") {
      setForm({
        name: "",
        targetAmount: "",
        targetDate: "",
        description: "",
      });
    }
  };

  const openModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setForm({
        name: milestone.name,
        targetAmount: milestone.targetAmount.toString(),
        targetDate: milestone.targetDate || "",
        description: milestone.description || "",
      });
    } else {
      resetForm();
    }
    onOpen();
  };

  const calculateProgress = (targetAmount: number): number => {
    return Math.min(100, Math.max(0, (netWorth / targetAmount) * 100));
  };

  const achievedMilestones = milestones.filter((m) => m.achieved);
  const pendingMilestones = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => a.targetAmount - b.targetAmount);

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
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Milestones
                  </h1>
                </div>
                <p className="text-xl text-white/90 max-w-2xl">
                  Track your progress and celebrate achievements on your FIRE journey
                </p>
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">{milestones.length} total milestones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">{achievedMilestones.length} achieved</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  color="secondary"
                  variant="solid"
                  size="lg"
                  startContent={<Plus className="h-5 w-5" />}
                  onPress={() => openModal()}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  Add Milestone
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
            {/* Total Milestones Card */}
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{milestones.length}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Milestones
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {milestones.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievedMilestones.length} achieved, {pendingMilestones.length} pending
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Achieved Milestones Card */}
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {milestones.length > 0 ? ((achievedMilestones.length / milestones.length) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Achieved
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {achievedMilestones.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Milestones completed
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Current Net Worth Card */}
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Baseline</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Current</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Net Worth
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(netWorth, settings.currency)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Progress tracking baseline
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Pending Milestones */}
          {pendingMilestones.length > 0 && (
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Pending Milestones
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <div className="space-y-6">
                  {pendingMilestones.map((milestone) => {
                    const progress = calculateProgress(milestone.targetAmount);
                    const canAchieve = netWorth >= milestone.targetAmount;

                    return (
                      <div
                        key={milestone.id}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {milestone.name}
                                </h4>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {milestone.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Target: {formatCurrency(milestone.targetAmount, settings.currency)}
                                  </p>
                                  {milestone.targetDate && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Due: {new Date(milestone.targetDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {canAchieve && (
                                <Button
                                  color="success"
                                  size="sm"
                                  startContent={<Trophy className="h-4 w-4" />}
                                  onPress={() => achieveMilestone(milestone.id)}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                >
                                  Achieve
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => openModal(milestone)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={() => deleteMilestone(milestone.id)}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Progress
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              color={
                                progress >= 100
                                  ? "success"
                                  : progress >= 75
                                    ? "warning"
                                    : "primary"
                              }
                              size="lg"
                              value={progress}
                              classNames={{
                                indicator: progress >= 100
                                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                                  : progress >= 75
                                    ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                                    : "bg-gradient-to-r from-blue-400 to-cyan-400"
                              }}
                            />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Current: {formatCurrency(netWorth, settings.currency)}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {milestone.targetAmount > netWorth
                                  ? `${formatCurrency(milestone.targetAmount - netWorth, settings.currency)} to go`
                                  : "Target reached!"
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Achieved Milestones */}
          {achievedMilestones.length > 0 && (
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Achieved Milestones
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <div className="space-y-4">
                  {achievedMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl"></div>
                      <div className="relative border border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10 rounded-xl p-6 hover:border-green-300 dark:hover:border-green-600 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {milestone.name}
                                <Star className="w-4 h-4 text-yellow-500" />
                              </h4>
                              {milestone.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {formatCurrency(milestone.targetAmount, settings.currency)}
                                </p>
                                {milestone.achievedDate && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Achieved: {new Date(milestone.achievedDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() => openModal(milestone)}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => deleteMilestone(milestone.id)}
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
              </CardBody>
            </Card>
          )}

          {/* Empty State */}
          {milestones.length === 0 && (
            <Card className="h-fit border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardBody className="px-6 py-12">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No milestones yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Create milestones to track your progress towards FIRE goals and celebrate achievements along the way.
                  </p>
                  <Button
                    color="primary"
                    size="lg"
                    startContent={<Plus className="h-5 w-5" />}
                    onPress={() => openModal()}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  >
                    Add Your First Milestone
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingMilestone ? "Edit Milestone" : "Add Milestone"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {!editingMilestone && (
                    <Select
                      label="Quick Start"
                      placeholder="Choose from common milestones"
                      selectedKeys={selectedDefaultMilestone ? [selectedDefaultMilestone] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        handleDefaultMilestoneSelect(selectedKey);
                      }}
                    >
                      {getDefaultMilestones().map((milestone) => (
                        <SelectItem key={milestone.key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{milestone.name}</span>
                            {milestone.targetAmount > 0 && (
                              <span className="text-sm text-gray-500">
                                {formatCurrency(milestone.targetAmount, settings.currency)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                  <Input
                    label="Milestone Name"
                    placeholder="e.g., First $100k, Coast FIRE"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    label="Target Amount"
                    placeholder="0"
                    startContent={<span className="text-gray-500">$</span>}
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) =>
                      setForm({ ...form, targetAmount: e.target.value })
                    }
                  />
                  <Input
                    label="Target Date (Optional)"
                    type="date"
                    value={form.targetDate}
                    onChange={(e) =>
                      setForm({ ...form, targetDate: e.target.value })
                    }
                  />
                  <Input
                    label="Description (Optional)"
                    placeholder="What does achieving this milestone mean to you?"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSubmit}>
                  {editingMilestone ? "Update" : "Add"} Milestone
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
