import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { Field } from "@/components/ui/Field";

interface FireInclusionToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  /** What including it means here, e.g. "Funds retirement". */
  includedHint: string;
  /** What excluding it means here, e.g. "Net worth only". */
  excludedHint: string;
  tone?: "accent" | "loss";
}

/**
 * Whether a holding or debt belongs to the pot that funds retirement.
 *
 * Presented as a pair of labelled choices rather than a switch because the
 * excluded case needs its own explanation — "off" alone reads as a mistake.
 */
export function FireInclusionToggle({
  value,
  onChange,
  includedHint,
  excludedHint,
  tone = "accent",
}: FireInclusionToggleProps) {
  return (
    <Field label="FIRE target">
      <ChoiceCards
        options={[
          {
            value: "included",
            label: "Counts toward FIRE",
            hint: includedHint,
          },
          { value: "excluded", label: "Net worth only", hint: excludedHint },
        ]}
        tone={tone}
        value={value ? "included" : "excluded"}
        onChange={(next) => onChange(next === "included")}
      />
    </Field>
  );
}
