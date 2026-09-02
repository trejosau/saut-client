"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";

export type NumberStepperProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size"> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md";
};

const sizes = {
  sm: { shell: "h-7", button: "h-7 w-7", input: "h-7 w-9 text-[10px]" },
  md: { shell: "h-10", button: "h-10 w-10", input: "h-10 w-12 text-[12px]" },
} as const;

function clamp(value: number, min: number, max?: number) {
  const finite = Number.isFinite(value) ? value : min;
  return Math.max(min, max === undefined ? finite : Math.min(max, finite));
}

export const NumberStepper = React.forwardRef<HTMLInputElement, NumberStepperProps>(function NumberStepper(
  { value, onValueChange, min = 0, max, step = 1, size = "md", className, disabled, "aria-label": ariaLabel, ...props },
  ref,
) {
  const metrics = sizes[size];
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);
  const update = (next: number) => onValueChange(clamp(next, min, max));

  return (
    <div className={cn("saut-number-stepper inline-flex items-center overflow-hidden rounded-full border border-hairline bg-soft-cloud", metrics.shell, disabled && "opacity-60", className)}>
      <button type="button" disabled={!canDecrease} className={cn("grid place-items-center border-0 bg-transparent text-ink transition hover:bg-hairline-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info disabled:cursor-not-allowed disabled:opacity-40", metrics.button)} onClick={() => update(value - step)} aria-label={ariaLabel ? `Disminuir ${ariaLabel}` : "Disminuir valor"}>
        <Minus size={size === "sm" ? 13 : 16} aria-hidden="true" />
      </button>
      <input
        {...props}
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => update(Number(event.target.value))}
        className={cn("border-x border-hairline bg-transparent text-center font-black text-ink outline-none focus-visible:bg-soft-cloud", metrics.input)}
      />
      <button type="button" disabled={!canIncrease} className={cn("grid place-items-center border-0 bg-transparent text-ink transition hover:bg-hairline-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info disabled:cursor-not-allowed disabled:opacity-40", metrics.button)} onClick={() => update(value + step)} aria-label={ariaLabel ? `Aumentar ${ariaLabel}` : "Aumentar valor"}>
        <Plus size={size === "sm" ? 13 : 16} aria-hidden="true" />
      </button>
    </div>
  );
});

NumberStepper.displayName = "NumberStepper";

