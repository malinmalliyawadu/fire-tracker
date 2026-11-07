import { formatMoneyCompact } from "@/domain/format";
import { useSettings } from "@/store/settings";
import { usePortfolioTotals } from "@/store/derived";
import { Allocation } from "@/components/portfolio/Allocation";
import { AssetLedger } from "@/components/portfolio/AssetLedger";
import { LiabilityLedger } from "@/components/portfolio/LiabilityLedger";
import { Figure, FigureRow } from "@/components/ui/Figure";
import { Money } from "@/components/ui/Money";
import { PageIntro } from "@/components/ui/Section";

export default function Portfolio() {
  const totals = usePortfolioTotals();
  const currency = useSettings((s) => s.settings.displayCurrency);

  return (
    <div className="space-y-16">
      <div>
        <PageIntro
          lede="Everything you own and owe. The pot that funds retirement is marked out from the rest."
          title="Portfolio"
        />
        <FigureRow cols={4}>
          <Figure
            label="Net worth"
            size="lg"
            value={<Money amount={totals.netWorth} currency={currency} />}
          />
          <Figure
            label="Assets"
            size="lg"
            value={<Money amount={totals.assetsTotal} currency={currency} />}
          />
          <Figure
            label="Liabilities"
            size="lg"
            value={
              <Money amount={totals.liabilitiesTotal} currency={currency} />
            }
          />
          <Figure
            hint={
              totals.hasExclusions
                ? `${formatMoneyCompact(totals.excludedNetWorth, currency)} held outside the plan`
                : "Assets less debt in the plan"
            }
            label="FIRE pot"
            size="lg"
            value={<Money amount={totals.fireNetWorth} currency={currency} />}
          />
        </FigureRow>
      </div>

      <Allocation />
      <AssetLedger />
      <LiabilityLedger />
    </div>
  );
}
