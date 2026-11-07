import type { Asset } from "@/types";

import { EyeOff, Lock, Plus, Wallet } from "lucide-react";
import { useState } from "react";

import { AssetEditor } from "./AssetEditor";

import { ASSET_TYPE_LABEL } from "@/domain/labels";
import { convert, toMonthly } from "@/domain/currency";
import { countsTowardFire } from "@/domain/fire";
import { useSettings } from "@/store/settings";
import { usePortfolio } from "@/store/portfolio";
import { usePlanContributions } from "@/store/derived";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Cell,
  Ledger,
  LedgerHead,
  LedgerRow,
  OpenCell,
  Td,
  Th,
} from "@/components/ui/Ledger";
import { Money } from "@/components/ui/Money";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";

export function AssetLedger() {
  const assets = usePortfolio((s) => s.assets);
  const settings = useSettings((s) => s.settings);
  const contributions = usePlanContributions();
  const [editing, setEditing] = useState<Asset | undefined>();
  const [open, setOpen] = useState(false);

  const display = settings.displayCurrency;
  const rate = settings.usdToNzd;
  const unlockAge = settings.kiwisaverUnlockAge ?? 65;
  const supersededBySalary = contributions.kiwisaverFromSalary;

  const startAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const startEdit = (asset: Asset) => {
    setEditing(asset);
    setOpen(true);
  };

  return (
    <Section
      aside={
        <Button icon={Plus} size="sm" variant="primary" onClick={startAdd}>
          Add asset
        </Button>
      }
      title="Assets"
    >
      {assets.length === 0 ? (
        <EmptyState
          action={
            <Button size="sm" variant="primary" onClick={startAdd}>
              Add your first asset
            </Button>
          }
          description="Investments, savings, KiwiSaver, crypto, property. Anything that grows your net worth."
          icon={Wallet}
          title="No assets yet"
        />
      ) : (
        <Ledger>
          <LedgerHead>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th align="right">Value</Th>
            <Th align="right">Monthly contribution</Th>
            <Th aria-label="Open" />
          </LedgerHead>
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
                <LedgerRow
                  key={asset.id}
                  label={`Edit ${asset.name}`}
                  onOpen={() => startEdit(asset)}
                >
                  <Td>
                    <Cell primary={asset.name} secondary={asset.notes} />
                  </Td>
                  <Td>
                    <span className="inline-flex flex-wrap items-center gap-1.5 text-ink-2">
                      {ASSET_TYPE_LABEL[asset.type]}
                      {asset.currency === "USD" && <Tag>USD</Tag>}
                      {asset.type === "kiwisaver" && (
                        <Tag
                          icon={Lock}
                          title={`Locked until age ${unlockAge}`}
                        >
                          Locked to {unlockAge}
                        </Tag>
                      )}
                      {!countsTowardFire(asset) && (
                        <Tag
                          icon={EyeOff}
                          title="Counted in net worth, but not in the FIRE target"
                        >
                          Not in FIRE
                        </Tag>
                      )}
                    </span>
                  </Td>
                  <Td num align="right">
                    <Money amount={valueInDisplay} currency={display} />
                  </Td>
                  <Td num align="right">
                    {supersededBySalary && asset.type === "kiwisaver" ? (
                      <span
                        className="text-ink-3"
                        title="Contributions come from your salary's KiwiSaver rate, so this field is ignored"
                      >
                        From salary
                      </span>
                    ) : asset.contribution > 0 ? (
                      <Money amount={monthly} currency={display} />
                    ) : (
                      <span className="text-ink-4">&mdash;</span>
                    )}
                  </Td>
                  <OpenCell />
                </LedgerRow>
              );
            })}
          </tbody>
        </Ledger>
      )}

      <AssetEditor
        asset={editing}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </Section>
  );
}
