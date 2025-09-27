import type { Milestone } from "../types/fire";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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
  CheckCircle2,
} from "lucide-react";

import { useFireStore } from "../store/fireStore";
import { formatCurrency } from "../utils/fireCalculations";

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

  const netWorth = getNetWorth();

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Milestones
        </h1>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => openModal()}
        >
          Add Milestone
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Milestones
            </h3>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-blue-600">
              {milestones.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {achievedMilestones.length} achieved, {pendingMilestones.length}{" "}
              pending
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Achieved
            </h3>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">
              {achievedMilestones.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {milestones.length > 0
                ? (
                    (achievedMilestones.length / milestones.length) *
                    100
                  ).toFixed(0)
                : 0}
              % completion rate
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Net Worth
            </h3>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(netWorth, settings.currency)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Progress tracking baseline
            </p>
          </CardBody>
        </Card>
      </div>

      {pendingMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Milestones
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {pendingMilestones.map((milestone) => {
                const progress = calculateProgress(milestone.targetAmount);
                const canAchieve = netWorth >= milestone.targetAmount;

                return (
                  <div
                    key={milestone.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {milestone.name}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {milestone.description}
                          </p>
                        )}
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                          Target:{" "}
                          {formatCurrency(
                            milestone.targetAmount,
                            settings.currency,
                          )}
                        </p>
                        {milestone.targetDate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Target Date:{" "}
                            {new Date(
                              milestone.targetDate,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {canAchieve && (
                          <Button
                            color="success"
                            size="sm"
                            startContent={<Trophy className="h-3 w-3" />}
                            onPress={() => achieveMilestone(milestone.id)}
                          >
                            Achieve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => openModal(milestone)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => deleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
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
                        size="sm"
                        value={progress}
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>
                          {formatCurrency(netWorth, settings.currency)}
                        </span>
                        <span>
                          {formatCurrency(
                            milestone.targetAmount - netWorth,
                            settings.currency,
                          )}{" "}
                          to go
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {achievedMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Achieved Milestones
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {achievedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {milestone.name}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {milestone.description}
                          </p>
                        )}
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          {formatCurrency(
                            milestone.targetAmount,
                            settings.currency,
                          )}
                        </p>
                        {milestone.achievedDate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Achieved:{" "}
                            {new Date(
                              milestone.achievedDate,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => openModal(milestone)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => deleteMilestone(milestone.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {milestones.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No milestones yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create milestones to track your progress towards FIRE goals.
              </p>
              <Button
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={() => openModal()}
              >
                Add Your First Milestone
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingMilestone ? "Edit Milestone" : "Add Milestone"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
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
