import { Building2, Lock } from "lucide-react";
import { Input } from "@heroui/input";

import { useSettings } from "@/store/settings";

import { Card } from "@/components/ui/Card";

export function KiwiSaverCard() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  const unlockAge = settings.kiwisaverUnlockAge ?? 65;

  return (
    <Card
      action={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-accent">
          <Building2 className="h-4 w-4" />
        </span>
      }
      eyebrow="Locked retirement assets"
      title="KiwiSaver"
    >
      <p className="mb-5 text-sm text-ink-300">
        KiwiSaver funds are locked until eligibility age. Projections will keep
        them compounding but exclude them from any pre-unlock retirement
        withdrawals — so an early retirement before this age must be funded
        from accessible assets alone.
      </p>
      <div className="grid grid-cols-[auto_1fr] items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <Lock className="h-4 w-4 text-accent" />
        </div>
        <Input
          description="NZ default is 65 (matches NZ Super eligibility)"
          inputMode="numeric"
          label="Unlock age"
          value={unlockAge.toString()}
          variant="bordered"
          onValueChange={(v) =>
            update({ kiwisaverUnlockAge: parseInt(v) || 65 })
          }
        />
      </div>
    </Card>
  );
}
