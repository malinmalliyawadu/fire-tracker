import type { Currency } from "@/types";

import { Segmented } from "@/components/ui/Segmented";

interface CurrencyToggleProps {
  value: Currency;
  onChange: (value: Currency) => void;
}

const OPTIONS = [
  { value: "NZD" as Currency, label: "NZD" },
  { value: "USD" as Currency, label: "USD" },
];

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <Segmented
      ariaLabel="Currency"
      options={OPTIONS}
      size="sm"
      value={value}
      onChange={onChange}
    />
  );
}
