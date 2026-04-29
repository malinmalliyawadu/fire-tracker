import type { Asset } from "@/types";

import { Lock, Pencil, Wallet } from "lucide-react";
import { Button } from "@heroui/button";
import { useState } from "react";

import {
  ASSET_TYPE_LABEL,
  FREQUENCY_SHORT,
} from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { useSettings } from "@/store/settings";
import { usePortfolio } from "@/store/portfolio";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";

import { AssetEditor } from "./AssetEditor";

export function AssetTable() {
  const assets = usePortfolio((s) => s.assets);
  const settings = useSettings((s) => s.settings);
  const [editing, setEditing] = useState<Asset | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;
  const unlockAge = settings.kiwisaverUnlockAge ?? 65;

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (asset: Asset) => {
    setEditing(asset);
    setOpen(true);
  };

  return (
    <Card
      action={
        <Button
          className="bg-accent text-white"
          size="sm"
          onPress={startAdd}
        >
          + Add asset
        </Button>
      }
      eyebrow="Holdings"
      title="Assets"
    >
      {assets.length === 0 ? (
        <EmptyState
          action={
            <Button
              className="bg-accent text-white"
              size="sm"
              onPress={startAdd}
            >
              Add your first asset
            </Button>
          }
          description="Track investments, savings, KiwiSaver, crypto — anything that grows your net worth."
          icon={Wallet}
          title="No assets yet"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3 text-left font-medium">Name</th>
                <th className="pb-3 text-left font-medium">Type</th>
                <th className="pb-3 text-right font-medium">Value</th>
                <th className="pb-3 text-right font-medium">Contribution</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const valueInDisplay = convert(
                  asset.value,
                  asset.currency,
                  display,
                  rate,
                );
                const monthly = toMonthly(
                  convert(asset.contribution, asset.currency, display, rate),
                  asset.frequency,
                );

                return (
                  <tr
                    key={asset.id}
                    className="group border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-3.5">
                      <div className="font-medium">{asset.name}</div>
                      {asset.notes && (
                        <div className="mt-0.5 text-xs text-ink-400">
                          {asset.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-ink-300">
                          {ASSET_TYPE_LABEL[asset.type]}
                          {asset.currency === "USD" && (
                            <span className="text-[10px] text-accent">USD</span>
                          )}
                        </span>
                        {asset.type === "kiwisaver" && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-accent"
                            title={`Locked until age ${unlockAge}`}
                          >
                            <Lock className="h-2.5 w-2.5" />
                            {unlockAge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <Money amount={valueInDisplay} currency={display} />
                    </td>
                    <td className="py-3.5 text-right text-ink-200">
                      {asset.contribution > 0 ? (
                        <>
                          <Money amount={monthly} currency={display} />
                          <span className="ml-1 text-xs text-ink-400">
                            {FREQUENCY_SHORT.monthly}
                          </span>
                        </>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <button
                        aria-label={`Edit ${asset.name}`}
                        className="rounded-md p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                        onClick={() => startEdit(asset)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AssetEditor
        asset={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}
