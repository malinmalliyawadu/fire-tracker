import type { ReactNode, Ref } from "react";

import clsx from "clsx";
import { useId } from "react";

import { Field, INPUT_FRAME } from "@/components/ui/Field";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  required?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  inputRef,
}: TextFieldProps) {
  const id = useId();

  return (
    <Field htmlFor={id} label={label} meta={hint} required={required}>
      <input
        ref={inputRef}
        className={clsx(INPUT_FRAME, "h-11 px-3.5 text-[15px]")}
        id={id}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
