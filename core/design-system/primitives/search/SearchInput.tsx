"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { TextField, type TextFieldProps } from "@/core/design-system/primitives/input/TextField";

export type SearchInputProps = Omit<TextFieldProps, "type" | "leftIcon" | "rightIcon"> & {
  onClear?: () => void;
};

export function SearchInput({ onClear, value, defaultValue, ...props }: SearchInputProps) {
  const hasValue = String(value ?? defaultValue ?? "").length > 0;
  return (
    <TextField
      {...props}
      type="search"
      value={value}
      defaultValue={defaultValue}
      leftIcon={<Search size={16} aria-hidden="true" />}
      rightIcon={hasValue && onClear ? <button type="button" aria-label="Limpiar búsqueda" onClick={onClear} className="saut-field-icon-button"><X size={15} /></button> : undefined}
    />
  );
}

