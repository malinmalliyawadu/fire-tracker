import { AlertTriangle, Check, Info } from "lucide-react";

import { useSanityWarnings } from "@/store/derived";
import { Card } from "@/components/ui/Card";

export function AssumptionsCard() {
  const warnings = useSanityWarnings();

  const serious = warnings.filter((w) => w.level === "warning");
  const notes = warnings.filter((w) => w.level === "note");

  return (
    <Card
      action={
        warnings.length > 0 ? (
          <span
            className={
              "text-[11px] uppercase tracking-[0.18em] " +
              (serious.length > 0 ? "text-loss" : "text-amber-400")
            }
          >
            {serious.length > 0
              ? `${serious.length} to check`
              : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.18em] text-gain">
            All clear
          </span>
        )
      }
      eyebrow="Plausibility"
      title="Assumptions"
    >
      {warnings.length === 0 ? (
        <div className="flex items-center gap-2.5 text-sm text-ink-300">
          <Check className="h-4 w-4 text-gain" />
          Nothing looks internally inconsistent. These are arithmetic checks,
          not advice.
        </div>
      ) : (
        <div className="space-y-2.5">
          {[...serious, ...notes].map((warning) => {
            const isWarning = warning.level === "warning";

            return (
              <div
                key={warning.id}
                className={
                  "rounded-lg border p-3 " +
                  (isWarning
                    ? "border-loss/20 bg-loss/[0.05]"
                    : "border-amber-500/20 bg-amber-500/[0.04]")
                }
              >
                <div className="flex items-start gap-2.5">
                  {isWarning ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
                  ) : (
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {warning.title}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-300">
                      {warning.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
