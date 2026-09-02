"use client";

import * as React from "react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormLabel } from "@/core/design-system/primitives/field";

export type RangeFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  output?: React.ReactNode;
  wrapperClassName?: string;
  labelClassName?: string;
};

/** Shared accessible range/slider field. Domain controls only provide bounds and value mapping. */
export const RangeField = React.forwardRef<HTMLInputElement, RangeFieldProps>(function RangeField(
  { label, hint, output, wrapperClassName, labelClassName, id, disabled, required, className, ...props },
  ref,
) {
  const reactId = React.useId();
  const inputId = id ?? `range-${reactId}`;
  return (
    <div className={cn("saut-field", wrapperClassName)}>
      {label !== undefined ? (
        <div className="flex items-center justify-between gap-2">
          <FormLabel className={labelClassName} htmlFor={inputId} required={required}>{label}</FormLabel>
          {output !== undefined ? <output htmlFor={inputId} className="text-[10px] font-black text-(--muted)">{output}</output> : null}
        </div>
      ) : null}
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="range"
        disabled={disabled}
        required={required}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn("saut-range", className)}
      />
      {hint ? <FormDescription id={`${inputId}-hint`}>{hint}</FormDescription> : null}
    </div>
  );
});

RangeField.displayName = "RangeField";
