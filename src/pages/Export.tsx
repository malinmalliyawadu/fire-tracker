import { ExportCard } from "@/components/settings/ExportCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Export() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Snapshot your portfolio, FIRE targets, and saved scenarios as a structured document. Paste into any LLM for personalised analysis, or save as a backup."
        eyebrow="Share & backup"
        title="Export"
      />
      <ExportCard />
    </div>
  );
}
