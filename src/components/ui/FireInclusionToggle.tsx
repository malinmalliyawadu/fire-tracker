import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { Field } from "@/components/ui/Field";

interface FireInclusionToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  /** What including it means here, e.g. "Funds retirement". */
  includedHint: string;
  /** What excluding it means here, e.g. "Net worth only". */
  excludedHint: string;
}

/**
 * Whether a holding or debt belongs to the pot that funds retirement.
 *
 * Presented as a pair of labelled choices rather than a switch because the
 * excluded case needs its own explanation: "off" alone reads as a mistake.
 */
export function FireInclusionToggle({
  value,
  onChange,
  includedHint,
  excludedHint,
}: FireInclusionToggleProps) {
  return (
    <Field label="Counts toward FIRE?">
      <ChoiceCards
        options={[
          {
            value: "included",
            label: "Yes, part of the pot",
            hint: includedHint,
          },
          {
            value: "excluded",
            label: "No, net worth only",
            hint: excludedHint,
          },
        ]}
        value={value ? "included" : "excluded"}
        onChange={(next) => onChange(next === "included")}
      />
    </Field>
  );
}
