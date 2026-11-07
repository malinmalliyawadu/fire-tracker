import clsx from "clsx";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

import { buildSnapshotJson, buildSnapshotMarkdown } from "@/domain/export";
import { useExpenses } from "@/store/expenses";
import { useHistory } from "@/store/history";
import { useIncome } from "@/store/income";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { Panel } from "@/components/ui/Section";
import { Segmented } from "@/components/ui/Segmented";

type Format = "markdown" | "json";

const FORMATS = [
  { value: "markdown" as Format, label: "Markdown", icon: FileText },
  { value: "json" as Format, label: "JSON", icon: FileJson },
];

export function ExportData() {
  const settings = useSettings((s) => s.settings);
  const assets = usePortfolio((s) => s.assets);
  const liabilities = usePortfolio((s) => s.liabilities);
  const scenarios = useScenarios((s) => s.scenarios);
  const history = useHistory((s) => s.snapshots);
  const income = useIncome((s) => s.sources);
  const expenses = useExpenses((s) => s.expenses);
  const events = useExpenses((s) => s.events);
  const kids = useExpenses((s) => s.kids);

  const [format, setFormat] = useState<Format>("markdown");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const content = useMemo(() => {
    const input = {
      settings,
      assets,
      liabilities,
      scenarios,
      history,
      income,
      expenses,
      events,
      kids,
    };

    return format === "markdown"
      ? buildSnapshotMarkdown(input)
      : buildSnapshotJson(input);
  }, [
    format,
    settings,
    assets,
    liabilities,
    scenarios,
    history,
    income,
    expenses,
    events,
    kids,
  ]);

  const extension = format === "markdown" ? "md" : "json";
  const fileName = `fire-snapshot-${new Date().toISOString().slice(0, 10)}.${extension}`;
  const mime = format === "markdown" ? "text/markdown" : "application/json";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers and insecure contexts: the preview can still be selected.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-ink">Export</h3>
          <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-snug text-ink-3">
            A snapshot of the whole plan. Markdown reads well pasted into an
            assistant for analysis; JSON is the backup you can load back in.
          </p>
        </div>
        <Segmented
          ariaLabel="Export format"
          options={FORMATS}
          size="sm"
          value={format}
          onChange={setFormat}
        />
      </div>

      <FigureRow className="mt-5" cols={3}>
        <Figure label="Assets" size="sm" value={assets.length} />
        <Figure label="Liabilities" size="sm" value={liabilities.length} />
        <Figure label="Scenarios" size="sm" value={scenarios.length} />
      </FigureRow>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          icon={copied ? Check : Copy}
          variant="primary"
          onClick={() => void handleCopy()}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button icon={Download} onClick={handleDownload}>
          Download .{extension}
        </Button>
        <Button
          className="ml-auto"
          iconEnd={ChevronDown}
          size="sm"
          variant="ghost"
          onClick={() => setShowPreview((s) => !s)}
        >
          <span className={clsx(showPreview && "[&+svg]:rotate-180")}>
            {showPreview ? "Hide preview" : "Show preview"}
          </span>
        </Button>
      </div>

      {showPreview && (
        <Panel className="mt-4 max-h-96 overflow-auto" tone="wash">
          <pre className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-2">
            {content}
          </pre>
        </Panel>
      )}
    </div>
  );
}
