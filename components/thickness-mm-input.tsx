"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { sanitizeThicknessMmTyping } from "@/lib/sales/thickness-mm";

type ThicknessMmInputProps = {
  id?: string;
  name: string;
  required?: boolean;
  placeholder?: string;
};

/** Ketebalan mm: desimal hanya titik (.); koma diblok saat ketik dan dinormalisasi saat paste. */
export function ThicknessMmInput({ id, name, required, placeholder }: ThicknessMmInputProps) {
  const [value, setValue] = useState("");

  return (
    <Input
      id={id}
      name={name}
      required={required}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(sanitizeThicknessMmTyping(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === ",") {
          e.preventDefault();
        }
      }}
    />
  );
}
