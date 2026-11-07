import type { BackupPayload, BackupSummary } from "@/domain/backup";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { parseBackup } from "@/domain/backup";
import { useExpenses } from "@/store/expenses";
import { useHistory } from "@/store/history";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

type Stage =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "confirm"; raw: string; summary: BackupSummary }
  | { kind: "done"; summary: BackupSummary };

export function ImportData() {
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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-ink">Import a backup</h3>
          <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-snug text-ink-3">
            Load a JSON snapshot exported from this app, on a new device or to
            roll back. Everything currently in the app is replaced.
          </p>
        </div>
        {stage.kind === "idle" && (
          <Button icon={Upload} onClick={() => fileRef.current?.click()}>
            Choose a backup file
          </Button>
        )}
      </div>

      <input
        ref={fileRef}
        accept="application/json,.json"
        className="hidden"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {stage.kind === "error" && (
        <Callout
          action={
            <Button size="sm" onClick={() => setStage({ kind: "idle" })}>
              Try another file
            </Button>
          }
          className="mt-5"
          title="That file could not be read"
          tone="warning"
        >
          {stage.message}
        </Callout>
      )}

      {stage.kind === "confirm" && (
        <Callout
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={confirm}>
                Replace my data
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStage({ kind: "idle" })}
              >
                Cancel
              </Button>
            </div>
          }
          className="mt-5"
          title="This replaces everything currently in the app"
          tone="note"
        >
          {stage.summary.generatedAt && (
            <p>
              Backup taken{" "}
              <span className="num">
                {stage.summary.generatedAt.slice(0, 10)}
              </span>
              .
            </p>
          )}
          <SummaryGrid summary={stage.summary} />
        </Callout>
      )}

      {stage.kind === "done" && (
        <Callout
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStage({ kind: "idle" })}
            >
              Import another
            </Button>
          }
          className="mt-5"
          title="Restored"
          tone="success"
        >
          <SummaryGrid summary={stage.summary} />
        </Callout>
      )}
    </div>
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
    <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[12px] text-ink-3">{label}</dt>
          <dd className="num text-[14px] font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
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
