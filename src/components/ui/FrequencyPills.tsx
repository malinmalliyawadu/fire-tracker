import type { ContributionFrequency } from "@/types";

import { FREQUENCIES, FREQUENCY_LABEL, FREQUENCY_PILL } from "@/domain/labels";
import { Segmented } from "@/components/ui/Segmented";

interface FrequencyPillsProps {
  value: ContributionFrequency;
  onChange: (value: ContributionFrequency) => void;
}

const OPTIONS = FREQUENCIES.map((f) => ({
  value: f,
  label: FREQUENCY_LABEL[f],
  shortLabel: FREQUENCY_PILL[f],
}));

export function FrequencyPills({ value, onChange }: FrequencyPillsProps) {
  return (
    <Segmented
      grow
      ariaLabel="How often"
      options={OPTIONS}
      size="sm"
      value={value}
      onChange={onChange}
    />
  );
}
