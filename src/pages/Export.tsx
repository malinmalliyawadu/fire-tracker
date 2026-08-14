import { ExportCard } from "@/components/settings/ExportCard";
import { ImportCard } from "@/components/settings/ImportCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Export() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Snapshot everything as a structured document — paste it into an LLM for analysis, keep it as a backup, or load one back in."
        eyebrow="Share & backup"
        title="Export"
      />
      <ExportCard />
      <ImportCard />
    </div>
  );
}
