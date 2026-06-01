"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { formatRupiah, parseRupiahToString } from "@/lib/rupiah";

type RupiahInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  /** Nilai numeric murni (string digit atau number dari state / database). */
  value: string | number;
  onValueChange: (numericString: string) => void;
};

export function RupiahInput({
  value,
  onValueChange,
  placeholder = "0",
  onWheel,
  ...props
}: RupiahInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatRupiah(value)}
      onChange={(event) => onValueChange(parseRupiahToString(event.target.value))}
      onKeyDown={(event) => {
        if (event.key === "," || event.key === "." || event.key === "e" || event.key === "E") {
          event.preventDefault();
        }
        props.onKeyDown?.(event);
      }}
      onWheel={(event) => {
        event.currentTarget.blur();
        onWheel?.(event);
      }}
    />
  );
}
