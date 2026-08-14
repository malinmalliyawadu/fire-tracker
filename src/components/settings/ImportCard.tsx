import type { BackupPayload, BackupSummary } from "@/domain/backup";

import { Button } from "@heroui/button";
import { AlertTriangle, Check, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { parseBackup } from "@/domain/backup";
import { useExpenses } from "@/store/expenses";
import { useHistory } from "@/store/history";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { Card } from "@/components/ui/Card";

type Stage =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "confirm"; raw: string; summary: BackupSummary }
  | { kind: "done"; summary: BackupSummary };

export function ImportCard() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  const restore = useRestore();

  const handleFile = async (file: File) => {
    const raw = await file.text();
    const result = parseBackup(raw);

    if (!result.ok) {
      setStage({ kind: "error", message: result.error });

      return;
    }

    setStage({ kind: "confirm", raw, summary: result.summary });
  };

  const confirm = () => {
    if (stage.kind !== "confirm") return;
    const result = parseBackup(stage.raw);

    if (!result.ok) {
      setStage({ kind: "error", message: result.error });

      return;
    }

    restore(result.payload);
    setStage({ kind: "done", summary: result.summary });
  };

  return (
    <Card eyebrow="Restore" title="Import a backup">
      <div className="space-y-4">
        <p className="max-w-xl text-sm text-ink-400">
          Load a JSON snapshot exported from this app — on a new device, or to
          roll back to an earlier state. Everything currently in the app is
          replaced.
        </p>

        <input
          ref={fileRef}
          accept="application/json,.json"
          className="hidden"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {stage.kind === "idle" && (
          <Button
            className="bg-accent text-white"
            startContent={<Upload className="h-3.5 w-3.5" />}
            onPress={() => fileRef.current?.click()}
          >
            Choose a backup file
          </Button>
        )}

        {stage.kind === "error" && (
          <div className="rounded-lg border border-loss/25 bg-loss/[0.06] p-3">
            <div className="flex items-center gap-2 text-sm text-loss">
              <AlertTriangle className="h-4 w-4" />
              {stage.message}
            </div>
            <Button
              className="mt-3"
              size="sm"
              variant="light"
              onPress={() => setStage({ kind: "idle" })}
            >
              Try another file
            </Button>
          </div>
        )}

        {stage.kind === "confirm" && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              This replaces everything currently in the app
            </div>
            {stage.summary.generatedAt && (
              <div className="mt-1 text-[11px] text-ink-400">
                Backup taken {stage.summary.generatedAt.slice(0, 10)}
              </div>
            )}
            <SummaryGrid summary={stage.summary} />
            <div className="mt-4 flex gap-2">
              <Button
                className="bg-accent text-white"
                size="sm"
                onPress={confirm}
              >
                Replace my data
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => setStage({ kind: "idle" })}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {stage.kind === "done" && (
          <div className="rounded-lg border border-gain/25 bg-gain/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gain">
              <Check className="h-4 w-4" />
              Restored
            </div>
            <SummaryGrid summary={stage.summary} />
            <Button
              className="mt-4"
              size="sm"
              variant="light"
              onPress={() => setStage({ kind: "idle" })}
            >
              Import another
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function SummaryGrid({ summary }: { summary: BackupSummary }) {
  const rows: Array<[string, number | string]> = [
    ["Assets", summary.assets],
    ["Liabilities", summary.liabilities],
    ["Income", summary.income],
    ["Expenses", summary.expenses],
    ["Life events", summary.events],
    ["Kids", summary.kids],
    ["Scenarios", summary.scenarios],
    ["Snapshots", summary.history],
    ["Settings", summary.hasSettings ? "yes" : "no"],
  ];

  return (
    <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-5">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="text-ink-500">{label}</div>
          <div className="font-mono tabular text-sm font-semibold text-white">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Replace every store from a validated payload.
 *
 * Zustand's persist middleware writes each store to its own localStorage key,
 * so restoring means setting each one rather than dropping in a single blob.
 */
const useRestore = () => {
  const setPortfolio = usePortfolio.setState;
  const setIncome = useIncome.setState;
  const setExpenses = useExpenses.setState;
  const setHistory = useHistory.setState;
  const setScenarios = useScenarios.setState;
  const updateSettings = useSettings((s) => s.update);

  return (payload: BackupPayload) => {
    setPortfolio({
      assets: payload.assets ?? [],
      liabilities: payload.liabilities ?? [],
    });
    setIncome({ sources: payload.income ?? [] });
    setExpenses({
      expenses: payload.expenses ?? [],
      events: payload.events ?? [],
      kids: payload.kids ?? [],
    });
    setHistory({ snapshots: payload.history ?? [] });
    setScenarios({ scenarios: payload.scenarios ?? [], comparedIds: [] });
    if (payload.settings) updateSettings(payload.settings);
  };
};
