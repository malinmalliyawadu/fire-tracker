import { Button } from "@heroui/button";
import { Check, ChevronDown, Copy, Download, FileJson, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { buildSnapshotJson, buildSnapshotMarkdown } from "@/domain/export";
import { useHistory } from "@/store/history";
import { usePortfolio } from "@/store/portfolio";
import { useScenarios } from "@/store/scenarios";
import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

type Format = "markdown" | "json";

export function ExportCard() {
  const settings = useSettings((s) => s.settings);
  const assets = usePortfolio((s) => s.assets);
  const liabilities = usePortfolio((s) => s.liabilities);
  const scenarios = useScenarios((s) => s.scenarios);
  const history = useHistory((s) => s.snapshots);

  const [format, setFormat] = useState<Format>("markdown");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const content = useMemo(() => {
    const input = { settings, assets, liabilities, scenarios, history };

    return format === "markdown"
      ? buildSnapshotMarkdown(input)
      : buildSnapshotJson(input);
  }, [format, settings, assets, liabilities, scenarios, history]);

  const fileName = `fire-snapshot-${new Date().toISOString().slice(0, 10)}.${format === "markdown" ? "md" : "json"}`;
  const mime = format === "markdown" ? "text/markdown" : "application/json";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers / insecure contexts — fall back to selection
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
    <Card
      action={
        <div className="inline-flex items-center rounded-full border border-white/[0.06] bg-black/30 p-0.5">
          <FormatPill
            active={format === "markdown"}
            icon={FileText}
            label="Markdown"
            onClick={() => setFormat("markdown")}
          />
          <FormatPill
            active={format === "json"}
            icon={FileJson}
            label="JSON"
            onClick={() => setFormat("json")}
          />
        </div>
      }
      eyebrow="Snapshot"
      title="Export for LLMs"
    >
      <p className="mb-5 text-sm text-ink-300">
        Generate a structured snapshot of your portfolio, FIRE targets, and
        saved scenarios. Paste it into any LLM (Claude, ChatGPT, etc.) for
        personalized analysis, or save it as a backup.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat label="Assets" value={assets.length} />
        <SummaryStat label="Liabilities" value={liabilities.length} />
        <SummaryStat label="Scenarios" value={scenarios.length} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          className="bg-gradient-to-br from-accent to-accent-deep text-white shadow-[0_8px_24px_-8px_rgba(124,131,231,0.6)]"
          startContent={
            copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )
          }
          onPress={handleCopy}
        >
          {copied ? "Copied" : "Copy to clipboard"}
        </Button>
        <Button
          startContent={<Download className="h-3.5 w-3.5" />}
          variant="flat"
          onPress={handleDownload}
        >
          Download .{format === "markdown" ? "md" : "json"}
        </Button>
        <button
          className="ml-auto inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-400 transition hover:text-white"
          onClick={() => setShowPreview((s) => !s)}
        >
          {showPreview ? "Hide" : "Show"} preview
          <ChevronDown
            className={clsx(
              "h-3 w-3 transition-transform",
              showPreview && "rotate-180",
            )}
          />
        </button>
      </div>

      {showPreview && (
        <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-white/[0.06] bg-black/30 p-4">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-200">
            {content}
          </pre>
        </div>
      )}
    </Card>
  );
}

interface FormatPillProps {
  active: boolean;
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}

function FormatPill({ active, icon: Icon, label, onClick }: FormatPillProps) {
  return (
    <button
      aria-pressed={active}
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
        active
          ? "bg-white/[0.12] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]"
          : "text-ink-400 hover:text-white",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 font-mono tabular text-xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}
