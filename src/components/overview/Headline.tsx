import { Link } from "react-router-dom";

import { formatMoney, formatMoneyCompact } from "@/domain/format";
import { describeYears, useFireSummary } from "@/hooks/useFireSummary";
import { useSettings } from "@/store/settings";
import { usePlanContributions } from "@/store/derived";

const LINK = "underline decoration-line underline-offset-4 hover:text-ink";

/** The sentence the app exists to say. */
export function Headline() {
  const summary = useFireSummary();
  const contributions = usePlanContributions();
  const currency = useSettings((s) => s.settings.displayCurrency);

  const monthly = contributions.monthlyContributions;

  return (
    <div>
      <h1 className="display-wide max-w-[22ch] text-[40px] text-ink lg:text-[56px]">
        {summary.reached ? (
          <>You are financially independent.</>
        ) : summary.never ? (
          <>Not yet on course for financial independence.</>
        ) : (
          <>
            Financially independent at{" "}
            <span className="num">{summary.age}</span>, in{" "}
            {describeYears(summary.years)}.
          </>
        )}
      </h1>
      <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">
        {summary.target <= 0 ? (
          <>
            There is no target yet because no spending is recorded.{" "}
            <Link className={LINK} to="/cashflow">
              Add what you spend
            </Link>{" "}
            and the number appears.
          </>
        ) : summary.never ? (
          <>
            At {formatMoney(monthly, currency)} a month the pot does not reach{" "}
            {formatMoneyCompact(summary.target, currency)} within the
            projection.{" "}
            <Link className={LINK} to="/simulate">
              See what would change it
            </Link>
            .
          </>
        ) : (
          <>
            Your pot is {formatMoneyCompact(summary.pot, currency)} of a{" "}
            {formatMoneyCompact(summary.target, currency)} target
            {monthly > 0 && (
              <>, growing by {formatMoney(monthly, currency)} a month</>
            )}
            . Everything here is in today&apos;s dollars.
          </>
        )}
      </p>
    </div>
  );
}
